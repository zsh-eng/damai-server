import { parseLinkHeaders } from '@/services/canvas/utils';
import { describe, expect, it } from 'vitest';

const SAMPLE_CANVAS_LINK_HEADER = `<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10>; rel="current",<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10>; rel="first",<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10>; rel="last"`;
const CORRUPTED_CANVAS_LINK_HEADER = `<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10>; rel="current",<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10>; rel="first",<https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10> rel="last"`;

describe('parseLinkHeaders', () => {
  it('should return empty object if linkHeader is undefined', () => {
    const linkHeader = undefined;
    const result = parseLinkHeaders(linkHeader);
    expect(result).toEqual({});
  });

  it('should return empty object if linkHeader is empty', () => {
    const linkHeader = '';
    const result = parseLinkHeaders(linkHeader);
    expect(result).toEqual({});
  })

  it('should return object with links', () => {
    const result = parseLinkHeaders(SAMPLE_CANVAS_LINK_HEADER);
    expect(result).toEqual({
      current: 'https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10',
      first: 'https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10',
      last: 'https://canvas.nus.edu.sg/api/v1/courses/63977/folders?page=1&per_page=10',
    });
  })

  it('should throw error if linkHeader is corrupted', () => {
    expect(() => parseLinkHeaders(CORRUPTED_CANVAS_LINK_HEADER)).toThrowError('Section could not be split on ";"');
  })
});
