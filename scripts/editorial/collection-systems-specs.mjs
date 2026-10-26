// All17 canonical nonvisual saved conditions/full official solutions/every MCQ read.
// Source4 contains SVG and is excluded. Several SUM systems are numeric variants,
// not different mathematical meanings; requested roles and sign regimes retained.
export const collection='0af1b4c8-e4a5-44fc-be2c-a84bb579f9d6';
export const systemSpecs=[
 [1,'decimal-clearing-ordered-pair',['0,4x + 6 = 2y','1,5y + 36 = 3x'],'eliminate_y','pair',[15,6]],
 [2,'second-equation-unit-x-substitution',['4x - 3y = -18','2y + x = 1'],'substitute_second','pair',[-3,2]],
 [3,'opposite-x-elimination-zero-coordinate',['3x + 4y = 16','3y - 4x = 12'],'eliminate_x','pair',[0,4]],
 [5,'ready-opposite-x-direct-addition',['5x - 3y = 4','5y - 5x = 0'],'eliminate_x','pair',[2,2]],
 [6,'first-unit-difference-substitution',['x - y = 3','3x - 5y = -5'],'substitute_first','pair',[10,7]],
 [7,'signed-positive-negative-sum',['7x + 4y = 23','2x - 3y = 19'],'eliminate_y','sum',[5,-3]],
 [8,'signed-negative-positive-sum',['8x - 5y = -71','4x + 6y = -10'],'eliminate_y','sum',[-7,3]],
 [9,'positive-sum-with-negative-second-coordinate',['3x - 7y = 48','4x + 5y = 21'],'eliminate_y','sum',[9,-3]],
 [10,'opposite-coordinate-zero-sum',['4x - 7y = 66','5x + 2y = 18'],'eliminate_y','sum',[6,-6]],
 [11,'one-decimal-coefficient-sum',['4x + 8y = -32','3x - 0,8y = 10'],'eliminate_y','sum',[2,-5]],
 [12,'two-decimal-coefficients-positive-sum',['0,4x - 3y = -18','-5x + 3,5y = -47'],'eliminate_y','sum',[15,8]],
 [13,'positive-negative-negative-sum',['8x + 5y = -16','6x - 7y = 74'],'eliminate_y','sum',[3,-8]],
 [14,'both-positive-sum',['7x + 3y = 55','6x - 4y = -12'],'eliminate_y','sum',[4,9]],
 [15,'subtract-negative-coordinate-negative-sum',['6x - 3y = 51','5x + 4y = -16'],'eliminate_y','sum',[4,-9]],
 [16,'negative-first-positive-second-negative-sum',['5x + 9y = 14','7x - 3y = -74'],'eliminate_y','sum',[-8,6]],
 [17,'both-negative-sum',['5x + 8y = -41','4x - 3y = -14'],'eliminate_y','sum',[-5,-2]],
 [18,'ready-cancellation-then-weighted-expression',['5x - 3y = 9','7y - 5x = -1'],'eliminate_x','expression',[3,2],'-4 × (3x + y)'],
].map(([number,kind,equations,method,target,handPair,expression])=>({number,kind,params:{equations,method,target,...expression?{expression}:{}},handPair}));
