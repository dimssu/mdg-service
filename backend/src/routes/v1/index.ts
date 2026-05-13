import { Router } from 'express';

import { authRouter } from './auth.js';
import { dealersAuditRouter } from './dealers.audit.js';
import { dealersRouter } from './dealers.js';
import {
  dealerNestedServicesRouter,
  dealerServicesRouter,
} from './dealerServices.js';
import { dealersOnboardingRouter } from './dealersOnboarding.js';
import { overviewRouter } from './overview.js';
import { runsRouter } from './runs.js';
import { servicesRouter } from './services.js';

export const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/dealers', dealersRouter);
v1Router.use('/dealers', dealersAuditRouter);
// Onboarding routes mount at /dealers/:id/onboarding/* — paths inside the router
// are written with the full prefix so they cooperate with mergeParams.
v1Router.use('/', dealersOnboardingRouter);
v1Router.use('/dealers/:id/services', dealerNestedServicesRouter);
v1Router.use('/dealer-services', dealerServicesRouter);
v1Router.use('/services', servicesRouter);
v1Router.use('/runs', runsRouter);
v1Router.use('/overview', overviewRouter);
