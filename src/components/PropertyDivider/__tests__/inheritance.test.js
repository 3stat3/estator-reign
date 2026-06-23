// src/components/PropertyDivider/__tests__/inheritance.test.js

import { calculateAllInheritance } from '../inheritance/index.js';
import { exampleData } from '../ExampleDataLoader.jsx';

describe('Inheritance Calculator', () => {
  test('calculates inheritance correctly for example data', () => {
    const result = calculateAllInheritance(exampleData);
    
    // Check that results exist
    expect(result.results).toBeDefined();
    expect(result.results.length).toBeGreaterThan(0);
    
    // Check chronological order
    const deathDates = result.results.map(r => r.deathDate);
    const sortedDates = [...deathDates].sort();
    expect(deathDates).toEqual(sortedDates);
    
    // Check specific person's inheritance
    const roshelito = result.results.find(r => r.decedent === 1);
    expect(roshelito).toBeDefined();
    expect(roshelito.assets.totalEstate).toBe(5000);
    expect(roshelito.distribution.heirs.length).toBe(6);
    
    // Check final distribution
    const finalDistribution = result.summary.finalDistribution;
    expect(finalDistribution).toBeDefined();
    
    // Sheryl and Aira should have 2500 each
    const sheryl = Object.values(finalDistribution).find(f => f.name === 'Sheryl');
    const aira = Object.values(finalDistribution).find(f => f.name === 'Aira');
    
    if (sheryl) {
      expect(Math.round(sheryl.total)).toBe(2500);
    }
    if (aira) {
      expect(Math.round(aira.total)).toBe(2500);
    }
  });
  
  test('handles no deceased persons', () => {
    const livingPeople = exampleData.filter(p => !p.isDeceased);
    const result = calculateAllInheritance(livingPeople);
    expect(result.results.length).toBe(0);
    expect(result.summary.totalEstate).toBe(0);
  });
  
  test('handles person with no properties', () => {
    const people = [
      {
        id: 1,
        name: 'Test Person',
        dod: '2020-01-01',
        isDeceased: true,
        properties: [],
        spouseId: null,
        parentId: null
      }
    ];
    const result = calculateAllInheritance(people);
    expect(result.results[0].assets.totalEstate).toBe(0);
  });
});