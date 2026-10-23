"""Verify figure provenance without running the audit's source-file mutations."""
import ast
import hashlib
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'problems/sources/zerek/courses'

def load_figure_metadata():
    module=ast.parse((ROOT/'scripts/audit-zerek-course-expansion.py').read_text())
    function=next(node for node in module.body if isinstance(node,ast.FunctionDef) and node.name=='figure_adaptation_metadata')
    namespace={}
    exec(compile(ast.Module(body=[function],type_ignores=[]),'figure-adaptation-metadata','exec'),namespace)
    return namespace['figure_adaptation_metadata']

class AdaptedCourseFigures(unittest.TestCase):
    def test_only_verified_adaptations_supply_a_disclosure(self):
        metadata=load_figure_metadata()
        vector={'image':'/figures/example.svg','sha256':'reviewed-svg','method':'adapted_from_source_solution',
                'visualReview':'verified','sourceAdapted':True,'adaptationNote':'Distractors reconstructed.'}
        result=metadata([{'src':'source'}],{'source':vector})
        self.assertTrue(result['sourceAdapted'])
        self.assertEqual(result['adaptationNote'],vector['adaptationNote'])
        self.assertEqual(result['figureAdaptations'][0],{**vector,'src':'source'})
        self.assertEqual(metadata([{'src':'source'}],{'source':{**vector,'visualReview':'pending'}}),{})
        self.assertEqual(metadata([{'src':'source'}],{'source':{'visualReview':'verified','method':'constructed_from_complete_condition'}}),{})
        for broken in [{**vector,'sourceAdapted':False},{**vector,'adaptationNote':''}]:
            with self.assertRaises(ValueError):metadata([{'src':'source'}],{'source':broken})

    def test_reconstructed_assets_match_durable_evidence_and_unchanged_raw_questions(self):
        evidence=json.loads((BASE/'reconstruction-evidence-higher46.json').read_text())['figures']
        self.assertEqual(len(evidence),11)
        for proof in evidence:
            row=proof['manifestRow'];source=proof['evidence']
            asset=ROOT/'frontend/public'/row['image'].lstrip('/')
            self.assertEqual(hashlib.sha256(asset.read_bytes()).hexdigest(),row['sha256'])
            raw=json.loads((BASE/source['sourceFile']).read_text())['questions'][source['sourceIndex']]
            self.assertEqual(raw['id'],source['sourceContentId'])
            self.assertEqual(hashlib.sha256(json.dumps(raw,sort_keys=True,ensure_ascii=False).encode()).hexdigest(),source['sourceQuestionSha256'])
            self.assertEqual(raw['sourceAnswer'],source['sourceAnswer'])

    def test_adapted_distractors_keep_the_unique_source_congruent_pair(self):
        proof=next(p for p in json.loads((BASE/'reconstruction-evidence-higher46.json').read_text())['figures']
                   if p['evidence']['sourceContentId']=='146be0405fa9a785')
        polygons=proof['evidence']['mathematicalData']['verticesByGridUnit']
        area=lambda vertices:abs(sum(x*b-a*y for (x,y),(a,b) in zip(vertices,vertices[1:]+vertices[:1])))/2
        self.assertEqual([area(p) for p in polygons],[5,5,3,7])
        self.assertEqual({(2-y,x) for x,y in polygons[0]},set(map(tuple,polygons[1])))
        decision=json.loads((BASE/'expansion-decisions.json').read_text())['146be0405fa9a785']
        self.assertTrue(decision['sourceAdapted'])
        self.assertEqual(decision['adaptationNote'],proof['manifestRow']['adaptationNote'])
        edit=next(edit for edit in decision['edits'] if proof['evidence']['editorialExcerpt'] in edit['after'])
        self.assertIn(edit['before'],proof['evidence']['sourceSolution'])
        self.assertTrue(edit['after'].endswith(edit['before']))
        vector=next(row for row in json.loads((BASE/'vector-manifest.json').read_text())['files'] if row['src']==proof['manifestRow']['src'])
        audited=load_figure_metadata()([{'src':vector['src']}],{vector['src']:vector})
        self.assertEqual(audited['adaptationNote'],decision['adaptationNote'])
        self.assertEqual(audited['figureAdaptations'][0]['sha256'],proof['manifestRow']['sha256'])

if __name__=='__main__':unittest.main()
