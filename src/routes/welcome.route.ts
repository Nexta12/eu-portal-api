import { Request, Response, Router } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.send({
    message: 'Welcome to the eUniversity Africa API. Kindly checkout the documentation here'
  });
});

export default router;
