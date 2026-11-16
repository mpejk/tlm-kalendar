import { getSection, sectionNames, parseFile } from '../import/dofile.mjs';
for (const [f, s] of [['Sancti/12-04', 'Rank'], ['Sancti/12-04', 'Introitus'], ['Sancti/12-04', 'Oratio'], ['Sancti/12-04', 'Graduale'], ['Tempora/Adv2-0', 'Rank'], ['Sancti/01-18r','Rank'],['Sancti/01-18r','Oratio'],['Sancti/12-08','Rank'],['Sancti/06-29','Commemoratio Oratio'],['Sancti/06-29','Oratio'], ['Tempora/Quad1-3','Lectio'], ['Tempora/Quad1-3','LectioL1'], ['Sancti/11-02','Rank']]) {
  console.log('==', f, s); console.log((getSection(f, s) || ['(none)']).join('\n').slice(0, 700));
}
console.log(sectionNames('Sancti/12-04'), sectionNames('Tempora/Quad1-3'), sectionNames('Tempora/Quad1-6'));
