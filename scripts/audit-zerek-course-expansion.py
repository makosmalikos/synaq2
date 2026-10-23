"""Audit captured course batches without promoting unresolved records to the bank."""
import collections, hashlib, importlib.util, json, pathlib, re, sys
import sympy as S
from zerek_math import decode_source_linebreaks, display_statement, expression, replace_inline_math, Unsupported
from review_zerek import model, mathparts
ROOT=pathlib.Path(__file__).resolve().parents[1];BASE=ROOT/'problems/sources/zerek/courses'
spec=importlib.util.spec_from_file_location('source_checks',ROOT/'scripts/prepare-zerek-import.py')
checks=importlib.util.module_from_spec(spec);spec.loader.exec_module(checks)
first=json.loads((BASE/'review-dispositions.json').read_text());prior={r['sourceContentId'] for r in first['records']}
vectors={r['src']:r for r in json.loads((BASE/'vector-manifest.json').read_text())['files']}
decisionsPath=BASE/'expansion-decisions.json'
decisions=json.loads(decisionsPath.read_text()) if decisionsPath.exists() else {}
records=[]
def figure_adaptation_metadata(images,vector_rows):
    adapted=[]
    for image in images:
        vector=vector_rows.get(image['src'])
        if not vector or vector.get('visualReview')!='verified':continue
        if vector.get('sourceAdapted') is not True and vector.get('method')!='adapted_from_source_solution':continue
        note=vector.get('adaptationNote')
        if vector.get('sourceAdapted') is not True or not isinstance(note,str) or not note.strip():
            raise ValueError('Reviewed adapted figure must retain sourceAdapted=true and an adaptationNote: '+image['src'])
        row={key:vector[key] for key in ['image','sha256','method','visualReview','sourceAdapted','adaptationNote']}
        row['src']=image['src']
        if vector.get('reconstructionEvidence'):row['reconstructionEvidence']=vector['reconstructionEvidence']
        adapted.append(row)
    if not adapted:return {}
    return {'sourceAdapted':True,'adaptationNote':'\n'.join(dict.fromkeys(r['adaptationNote'] for r in adapted)),
            'figureAdaptations':adapted}

def numeric_key(q):
    pieces=mathparts(q['sourceAnswer']) or [q['sourceAnswer']]
    if len(pieces)!=1:raise Unsupported('non-scalar key')
    scalar=pieces[0]
    if re.fullmatch(r'[+-]?\d+,\d+',scalar):scalar=scalar.replace(',','.')
    value=expression(scalar)
    if value.free_symbols:raise Unsupported('symbolic key')
    return value
def exact_model(q):
    # Only an unambiguous requested expression value, not numerator/digit questions.
    t=q['statement'];parts=mathparts(t)
    if not q.get('images') and len(parts)==1 and re.search(r'^(?:Есептеңдер|Есептеңіз|Қосыңдар|Азайтыңдар|Көбейтіңдер|Бөліңдер|Амалдарды орындаңдар|Өрнектің мәнін табыңдар|Өрнектің мәнін табыңыз)|өрнегінің мәнін табыңдар',t) and not re.search(r'алымын|бөлімін|қалдығын|бүтін бөлігін',t):
        v=expression(parts[0])
        if not v.free_symbols:return v,'condition expression'
    v,_,description,_=model(q);return v,description
for file in sorted([*BASE.glob('*-level[123].json'),*BASE.glob('*-leveltest.json')]):
    data=json.loads(file.read_text())
    if data['status']!='captured':continue
    assert data['grade'] in (4,5,6)
    for index,source in enumerate(data['questions']):
        if source['id'] in prior:continue
        q={**source,'options':source.get('options',[]),'images':source.get('images',[])}
        record={'file':file.name,'index':index,'sourceContentId':q['id'],'grade':data['grade'],'level':data['level'],'title':data['title'],'sourceUrl':data['url'],
                'sourceSha256':hashlib.sha256(json.dumps(source,sort_keys=True,ensure_ascii=False).encode()).hexdigest(),'issues':[]}
        assert q['checked'] and q['sourceAnswer'] and len(q['solution'])>30
        if q['options']:
            correct=[o for o in q['options'] if o['correct']]
            assert len(correct)==1 and correct[0]['text']==q['sourceAnswer']
        edits=decisions.get(q['id'],{}).get('edits',[])
        for edit in edits:
            assert edit['before'] in q[edit.get('field','solution')],(q['id'],edit)
            field=edit.get('field','solution');q[field]=q[field].replace(edit['before'],edit['after'])
        decoded_statement=decode_source_linebreaks(q['statement'])
        if decoded_statement!=q['statement']:
            edits=[*edits,{'field':'statement','before':q['statement'],'after':decoded_statement,'reason':'Decode literal source line-break markers outside mathematics; preserve TeX commands.'}]
            q['statement']=decoded_statement
        for tex in mathparts(q['solution']):
            if tex.count('=')!=1:continue
            left,right=tex.split('=')
            if left.count(':')!=1:continue
            dividend,divisor=left.split(':')
            try:
                a,b,c=map(expression,[dividend,divisor,right])
                if not all(v.is_Integer for v in [a,b,c]) or min(a,c)<0 or b<=0:continue
                remainder=a-b*c
                if not 0<remainder<b:continue
                exact=f'{dividend.strip()} = {divisor.strip()} \\cdot {right.strip()} + {remainder}'
                q['solution']=replace_inline_math(q['solution'],tex,exact)
                edits=[*edits,{'field':'solution','before':tex,'after':exact,'reason':'Verified Euclidean division A=BQ+R, with 0<R<B.'}]
            except (Unsupported,ValueError,TypeError,ZeroDivisionError):pass
        if edits:record['editorialChanges']=edits
        try:record['presentationChecks']=checks.presentation_checks(q)
        except RuntimeError as error:
            record['presentationChecks']=0
            record['issues'].append({'type':'math_presentation_value','detail':str(error)})
        count,conflicts=checks.solution_checks(q['solution']);record['arithmeticChecks']=count
        if conflicts:
            approved=decisions.get(q['id'],{}).get('falseExamples',[])
            unresolved=[c for c in conflicts if c not in approved]
            if unresolved:record['issues'].append({'type':'source_equalities','equalities':unresolved})
            if approved:record['reviewedFalseExamples']=approved
        try:
            value,method=exact_model(q);key=numeric_key(q)
            if S.simplify(value-key)!=0:record['issues'].append({'type':'independent_model_disagreement','computed':str(value),'key':str(key)})
            else:record['independentComputation']={'method':method,'value':str(value)}
        except (Unsupported,ValueError,TypeError,ZeroDivisionError,NotImplementedError):pass
        conclusion=re.split(r'Жауабы\s*:',q['solution'])[-1] if re.search(r'Жауабы\s*:',q['solution']) else None
        if conclusion and len(mathparts(conclusion))==1:
            try:
                final_tex=mathparts(conclusion)[0];final=expression(final_tex);key=numeric_key(q)
                if '%' in final_tex and '%' not in q['sourceAnswer'] and re.search(r'процент|пайыз',q['statement'],re.I):final*=100
                if not final.free_symbols:
                    if S.simplify(final-key)!=0:record['issues'].append({'type':'solution_answer_disagreement','conclusion':str(final),'key':str(key)})
                    else:record['solutionConclusionChecked']=True
            except (Unsupported,ValueError,TypeError,ZeroDivisionError,NotImplementedError):pass
        for im in q['images']:
            v=vectors.get(im['src'])
            if not v or v['visualReview']!='verified':record['issues'].append({'type':'figure_review','src':im['src']})
        try:record.update(figure_adaptation_metadata(q['images'],vectors))
        except ValueError as error:record['issues'].append({'type':'adaptation_provenance','detail':str(error)})
        if decisions.get(q['id'],{}).get('sourceAdapted') is True and not record.get('sourceAdapted'):
            record['issues'].append({'type':'adaptation_provenance','detail':'Editorial adaptation has no verified figure adaptation metadata.'})
        if len(q['images'])>1:record['issues'].append({'type':'multiple_figure_layout'})
        statement=re.sub(r'\n{3,}','\n\n',re.sub(r'\[Image:[^\]]*\]','',display_statement(q['statement']))).strip()
        solution=re.sub(r'\n{3,}','\n\n',display_statement(q['solution']))
        answer=display_statement(q['sourceAnswer']);options=[display_statement(o['text']) for o in q['options']] or None
        if any(re.search(r'[\\$]|\[SVG|\[Image:',v) for v in [statement,solution,answer]+(options or [])):record['issues'].append({'type':'math_presentation'})
        if options and (len(set(options))!=len(options) or options.count(answer)!=1):record['issues'].append({'type':'choices'})
        record['status']='needs_review' if record['issues'] else 'source_review_ready'
        record['prepared']={'statement':statement,'solution':solution,'answer':answer,'options':options}
        if q['images']:record['images']=[vectors[im['src']]['image'] for im in q['images'] if im['src'] in vectors]
        records.append(record)
summary={'capturedBeyondFirstBatch':len(records),'byGrade':dict(collections.Counter(r['grade'] for r in records)),
         'byLevel':dict(collections.Counter(r['level'] for r in records)),'status':dict(collections.Counter(r['status'] for r in records)),
         'issues':dict(collections.Counter(i['type'] for r in records for i in r['issues'])),'independentlyComputed':sum('independentComputation'in r for r in records),
         'arithmeticChecks':sum(r['arithmeticChecks'] for r in records),'presentationChecks':sum(r['presentationChecks'] for r in records),
         'solutionConclusionsChecked':sum(r.get('solutionConclusionChecked',False) for r in records)}
(BASE/'expansion-audit.json').write_text(json.dumps({'summary':summary,'records':records},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
