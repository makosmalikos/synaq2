"""Independent full10 root-authored nonvisual parallel-line review; no author imports."""
from importlib.util import spec_from_file_location,module_from_spec
from pathlib import Path
sp=spec_from_file_location('own_plane_lines',Path(__file__).with_name('review-grade6-plane-lines.py'));ind=module_from_spec(sp);sp.loader.exec_module(ind)
if __name__=='__main__':
    ind.run('grade6-parallel',ind.solve_parallel,[
        ('options','Бір жазықтықта жатады және ортақ нүктелері жоқ','Бір жазықтықта жатады және дәл бір ортақ нүктесі бар'),
        ('statement','v ⟂ r','v ∥ r'),('options','Сағаттың 2:00 кезіндегі ортақ осьтен шығатын екі тілі','Тіктөртбұрыштың қарама-қарсы екі қабырғасы'),
        ('statement','7 см','8 см'),('options','Тең болуы да, әртүрлі болуы да мүмкін','Әрқашан әртүрлі болады'),
        ('statement','ЖАТПАЙДЫ','ЖАТАДЫ'),('statement','q ∥ r','q ⟂ r'),
        ('statement','2-сызықтан','3-сызықтан'),('statement','KN қабырғасына','KL қабырғасына'),
        ('statement','7 см','8 см'),
    ])
