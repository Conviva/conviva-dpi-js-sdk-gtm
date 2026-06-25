import fs from 'node:fs';
import path from 'node:path';

const paramsPath = path.join(__dirname, '../libs/template-parameters.json');

describe('template-parameters.json', () => {
  it('matches snapshot (schema / field changes are visible in PR diffs)', () => {
    const json = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));
    expect(json).toMatchSnapshot();
  });
});
