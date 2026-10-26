"""Independent full11 root-authored nonvisual intersections review; no author imports."""
from importlib.util import spec_from_file_location,module_from_spec
from pathlib import Path
sp=spec_from_file_location('own_plane_lines',Path(__file__).with_name('review-grade6-plane-lines.py'));ind=module_from_spec(sp);sp.loader.exec_module(ind)
if __name__=='__main__':
    ind.run('grade6-intersections',ind.solve_intersections,[
        ('statement','екі бөлек','екі'),('statement','53°','54°'),
        ('statement','63°','64°'),('options','Тегіс үстелдің беті','Домалақ шардың беті'),
        ('statement','P, Q және R','P, Q және S'),('statement','БІРЕУІ','ЕКЕУІ'),
        ('statement','143°','144°'),('statement','ТӨРТ','ҮШ'),
        ('statement','5 БІР-БІРІМЕН','6 БІР-БІРІМЕН'),('statement','ӘРТҮРЛІ','бірдей'),
        ('options','Олардың градустық шамалары тең','Олардың қосындысы 180°'),
    ])
