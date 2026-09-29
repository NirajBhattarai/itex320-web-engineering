import { pageLinks } from '../utils/query.js';

export function createUsersController(usersService) {
  return {
    async list(req, res) {
      const { data, meta } = await usersService.list(req.query);
      res.json({ data, meta, links: pageLinks(req, meta) });
    },

    async getById(req, res) {
      res.json({ data: await usersService.getById(req.params.id) });
    },

    async create(req, res) {
      const user = await usersService.create(req.body);
      res.status(201).location(`${req.baseUrl}/${user.id}`).json({ data: user });
    },

    async update(req, res) {
      res.json({ data: await usersService.update(req.params.id, req.body) });
    },

    async remove(req, res) {
      await usersService.remove(req.params.id);
      res.status(204).end();
    },
  };
}
