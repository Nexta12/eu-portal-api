import { generateMatriculationNumber, generateReferenceNumber } from '../../utils';

const isLowerCase = (str: string) => str === str.toLowerCase();

describe('Helpers', () => {
  it('nanoId', () => {
    const nanoId = generateReferenceNumber();
    expect(nanoId).toHaveLength(10);
    expect(nanoId).toMatch(/[\da-z]/);
    expect(isLowerCase('Hello')).toBe(false);
  });

  it('generateMatriculationNumber', () => {
    const matriculationNumber = generateMatriculationNumber();
    expect(matriculationNumber).toHaveLength(12);
    expect(matriculationNumber).toContain('EUA');
  });
});
