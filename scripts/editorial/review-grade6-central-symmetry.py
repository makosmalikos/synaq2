from importlib.util import spec_from_file_location,module_from_spec
from pathlib import Path
sp=spec_from_file_location('own_symmetry',Path(__file__).with_name('review-grade6-symmetry.py'));ind=module_from_spec(sp);sp.loader.exec_module(ind)
if __name__=='__main__':ind.run('grade6-central-symmetry',ind.solve_central,[
 ('options','C нүктесі PP′ кесіндісінің ортасы','P нүктесі CP′ кесіндісінің ортасы'),
 ('statement','11 см','12 см'),('options','Тең қабырғалы үшбұрыш','Тіктөртбұрыш'),
 ('statement','B(0; 9)','B(0; 10)'),('options','180°','120°'),('statement','A(-6)','A(-8)'),
 ('statement','8 см','9 см'),('statement','A′(-4; 11)','A′(-5; 11)'),
 ('options','KM және LN','KL және MN'),('statement','10 см','12 см'),
 ('statement','9 см','10 см'),('statement','M(7; -10)','M(8; -10)'),
])
