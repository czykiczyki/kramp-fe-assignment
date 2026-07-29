import { fetchGraphQL } from '../src/utils/fetchGraphQL';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fetchGraphQL', () => {
  it('sends a POST request with the query/variables and returns the unwrapped `data` field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { foo: 'bar' } }),
    }) as jest.Mock;

    const result = await fetchGraphQL<{ foo: string }>('query { foo }', { id: '1' });

    expect(result).toEqual({ foo: 'bar' });
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://localhost:4000/graphql');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({ query: 'query { foo }', variables: { id: '1' } });
  });

  it('rejects with the HTTP status when the response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as jest.Mock;

    await expect(fetchGraphQL('query { foo }')).rejects.toThrow('500');
  });

  it('rejects with the GraphQL error message when the response contains errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ errors: [{ message: 'boom' }] }),
    }) as jest.Mock;

    await expect(fetchGraphQL('query { foo }')).rejects.toThrow('boom');
  });
});
