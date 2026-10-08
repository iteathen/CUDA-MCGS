// Qualification oracle: independent, fixed game graph and admitted path traces.
// This module is never shipped as active search or imported by the generator.
export function expectedDiamond() {
  const vertices=['root','left','right','terminal'];
  const edges=[['root','left'],['root','right'],['left','terminal'],['right','terminal']];
  const paths=[['root','left','terminal'],['root','right','terminal'],['root','left','terminal'],['root','right','terminal']];
  const visits=vertices.map(vertex=>paths.reduce((count,path)=>count+Number(path.includes(vertex)),0));
  const edgeVisits=edges.map(([from,to])=>paths.reduce((count,path)=>count+Number(path.some((vertex,i)=>vertex===from&&path[i+1]===to)),0));
  return {visits,values:visits.map(v=>v*5),edgeVisits,edgeValues:edgeVisits.map(v=>v*5)};
}
