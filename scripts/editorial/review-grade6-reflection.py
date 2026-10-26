from importlib.util import spec_from_file_location,module_from_spec
from pathlib import Path
sp=spec_from_file_location('own_symmetry',Path(__file__).with_name('review-grade6-symmetry.py'));ind=module_from_spec(sp);sp.loader.exec_module(ind)
if __name__=='__main__':ind.run('grade6-reflection',ind.solve_reflection,[
 ('options','H','P'),('options','бір-бірінің симметриялы бейнелері','өлшемдері әртүрлі'),
 ('statement','ШЕКСІЗ','ЕКІ'),('statement','Үш қабырғасы','Екі қабырғасы'),
 ('statement','V(3; -8)','V(-3; 8)'),('statement','Oy','Ox'),
 ('statement','7 см','8 см'),('options','перпендикуляр және','перпендикуляр немесе'),
 ('statement','C(5; -9)','C(5; -10)'),('options','g түзуінің барлық нүктелері','g түзуінің бір нүктесі'),
])
