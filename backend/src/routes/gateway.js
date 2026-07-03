// Gateway router. Mounted at /gw and open to the public internet — auth here is
// the API key, NOT the dashboard JWT. The wildcard captures the full upstream
// path so `/gw/anything/here` proxies to `<upstreamBaseUrl>/anything/here`.
import { Router } from 'express';
import { gatewayHandler } from '../gateway/gatewayHandler.js';
import { asyncHandler } from '../middleware/validate.js';

const router = Router();

// Match every method and every sub-path. `*` populates req.params[0].
router.all('/*', asyncHandler(gatewayHandler));

export default router;
