import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`Hoard API listening on port ${env.PORT}`);
});
