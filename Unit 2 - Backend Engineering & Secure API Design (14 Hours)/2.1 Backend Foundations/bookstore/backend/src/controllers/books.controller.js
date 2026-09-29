import { pageLinks } from '../utils/query.js';

// Controllers translate HTTP ⇄ service calls. No business rules live here.
// Express 5 forwards any thrown error / rejected promise to the error handler automatically.
export function createBooksController(booksService) {
  return {
    async list(req, res) {
      const { data, meta } = await booksService.list(req.query);
      res.json({ data, meta, links: pageLinks(req, meta) });
    },

    async getById(req, res) {
      res.json({ data: await booksService.getById(req.params.id) });
    },

    async create(req, res) {
      const book = await booksService.create(req.body);
      // 201 Created + Location header pointing at the new resource.
      res.status(201).location(`${req.baseUrl}/${book.id}`).json({ data: book });
    },

    async replace(req, res) {
      res.json({ data: await booksService.replace(req.params.id, req.body) });
    },

    async update(req, res) {
      res.json({ data: await booksService.update(req.params.id, req.body) });
    },

    async remove(req, res) {
      await booksService.remove(req.params.id);
      res.status(204).end();
    },
  };
}
