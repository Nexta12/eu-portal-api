import sgMail from '@sendgrid/mail';

import envConfig from './envConfig';

sgMail.setApiKey(envConfig.SENDGRID_API_KEY);

export default sgMail;
