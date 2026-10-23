"""Regeneration must not relabel an approved adaptation as an original diagram."""
import ast
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]

def load_review_retention():
    # The publisher writes assets/manifests at import time. Extract just this
    # pure function so the regression test cannot mutate real source files.
    source=ast.parse((ROOT/'scripts/figures/zerek/course-figures.py').read_text())
    definition=next(node for node in source.body if isinstance(node,ast.FunctionDef)
                    and node.name=='retain_unchanged_figure_review')
    namespace={}
    exec(compile(ast.Module(body=[definition],type_ignores=[]),'figure-review-retention','exec'),namespace)
    return namespace['retain_unchanged_figure_review']

class FigureReviewRetention(unittest.TestCase):
    def setUp(self):
        self.retain=load_review_retention()
        self.current={'src':'https://zerek.app/questions/example.png',
            'image':'/figures/zerek-courses/example.svg','sha256':'same-svg',
            'method':'constructed_from_complete_condition','visualReview':'pending'}
        self.approved={**self.current,'method':'adapted_from_source_solution',
            'sourceAdapted':True,'adaptationNote':'New distractors explicitly disclosed.',
            'visualReview':'verified','visualReviewNotes':'Compared all grid vertices.',
            'note':'Original distractor vertices unavailable.',
            'review':{'uniqueCongruentPair':[1,2]},
            'evidence':{'areas':[5,5,3,7],'sourceContentId':'source-question'}}

    def test_same_svg_preserves_complete_adaptation_provenance(self):
        result=self.retain(self.current,self.approved)
        for field in ['method','sourceAdapted','adaptationNote','visualReview',
                      'visualReviewNotes','note','review','evidence']:
            self.assertEqual(result[field],self.approved[field])
        for field in ['src','image','sha256']:
            self.assertEqual(result[field],self.current[field])
        self.assertEqual(self.current['visualReview'],'pending')

    def test_changed_svg_requires_new_review_without_stale_evidence(self):
        changed={**self.current,'sha256':'different-svg'}
        result=self.retain(changed,self.approved)
        self.assertEqual(result,changed)
        self.assertEqual(result['visualReview'],'pending')
        self.assertNotIn('evidence',result)

    def test_nonadapted_existing_review_keeps_previous_behaviour(self):
        previous={**self.current,'visualReview':'verified'}
        self.assertEqual(self.retain(self.current,previous),
                         {**self.current,'visualReview':'verified'})
        self.assertEqual(self.retain(self.current,{}),self.current)

if __name__=='__main__':unittest.main()
