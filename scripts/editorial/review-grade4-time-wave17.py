"""Compatibility entry point for the independently authored time review.
The reviewer suffix prevents parallel agents from overwriting its oracle.
"""
import importlib.util
from pathlib import Path
_target=Path(__file__).with_name('review-grade4-time-wave17-rendering.py')
_spec=importlib.util.spec_from_file_location('independent_time_rendering_review',_target)
_module=importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)
if __name__=='__main__':_module.main()
