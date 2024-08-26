import envConfig from '../config/envConfig';

type AdmissionLetterEmailTemplateProps = {
  studentName: string;
  matriculationNumber: string;
  session: string;
  cohort: string;
  programme: string;
};

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

export const generateAdminRegisterEmailTemplate = (name: string, password: string) => {
  const loginUrl = `${envConfig.CLIENT_BASE_URL}/login`;
  return `
    <div style="font-family: Arial,serif">
      <div style='margin-bottom: 20px'>Hi ${name}!</div>
      <div style='margin-bottom: 20px'>Please use these credentials to access to eUniversity Africa portal, click this <a href='${loginUrl}' target='_blank'>
      ${loginUrl}
      </a> and use this password</div>
      <div style='font-size: 20px; margin-bottom: 20px; font-weight: bold'>${password}</div>
      <div>Best regards!</div>
    </div>
  `;
};
export const generateApplicationEmailTemplate = (name: string, password: string) => {
  const loginUrl = `${envConfig.CLIENT_BASE_URL}/login`;
  return `
    <div style="font-family: Arial,serif">
      <div style='margin-bottom: 20px'>Hi ${name}!</div>
      <div style='margin-bottom: 20px'>To continue your application to eUniversity Africa, click this <a href='${loginUrl}' target='_blank' style='background-color: blue; padding: 5px; color: #fff; border-radius: 5px; margin: 5px;' >
      Click Here
      </a> and use this password</div>
      <div style='font-size: 20px; margin-bottom: 20px; font-weight: bold'>${password}</div>
      <div>Best regards!</div>
    </div>
  `;
};

export const generateContactFormReplyTemplate = (firstName: string, lastName: string, message: string) => `
    <div style="font-family: Arial,serif">
      <div style='margin-bottom: 20px'>Dear ${firstName} ${firstName}!</div>
      <div style='margin-bottom: 20px'>
        ${message}
      </div>
    </div>
  `;

export const generateForgotPasswordEmailTemplate = (token: string, userId: string) => {
  const passwordResetLink = `${envConfig.CLIENT_BASE_URL}/reset-password?token=${token}&userId=${userId}`;
  return `
    <div style="font-family: Arial,serif">
      <div style='margin-bottom: 20px'>Hi!</div>
      <div style='margin-bottom: 20px'>
        You initiated a password reset. Click <a href='${passwordResetLink}' target='_blank'>this link</a> to reset your password
      </div>
      <div style='margin-bottom: 20px'>${passwordResetLink}</div>
      <div>Best regards!</div>
      <div>eUniversity Africa</div>
    </div>
  `;
};

export const generateAdmissionLetterEmailTemplate = ({
  studentName,
  matriculationNumber,
  programme,
  cohort,
  session
}: AdmissionLetterEmailTemplateProps) => {
  const loginUrl = `${envConfig.CLIENT_BASE_URL}/login`;
  return `
    <div style="font-family: Arial, sans-serif;">
      <div style="margin-bottom: 20px;">Dear ${capitalize(studentName)},</div>
      <div style="margin-bottom: 20px;">
        We are delighted to inform you that you have been admitted to eUniversity Africa as a <strong>${capitalize(
    cohort
  )}</strong> student in the department of <strong>${programme}</strong> for the <strong>${session}</strong> session. This electronic letter is your official notice of admission.
      </div>
      <div style="margin-bottom: 20px;">
        This admission letter is valid only for the <strong>${session}</strong> session.
      </div>
      <div style="margin-bottom: 20px;">
        At eUniversity Africa, you will have the opportunity to develop marketable skills that will prepare you for a successful career in your chosen field through hands-on learning and student-centered curriculum, facilitated by some of the top experts in the world.
      </div>
      <div style="margin-bottom: 20px;">Your Matriculation Number is: <strong>${matriculationNumber}</strong> and you can log in to your student portal at <a href='${loginUrl}' target='_blank'>${loginUrl}</a> to access your student dashboard and learning content. Your matriculation number is your unique identification number and will be your access code to everything during your studentship at eUniversity Africa.</div>
      <div style="margin-bottom: 20px;">
        Students are highly encouraged to have access to a laptop to make their learning experience seamless and maximize their engagement with instructors, course content, and other student support resources.
      </div>
      <div style="margin-bottom: 20px;">
        Still have questions? We are here to help. Please send an email to <a href="mailto:admission@euniversityafrica.edu">admission@euniversityafrica.edu</a> with any questions you have.
      </div>
      <div>Once again, congratulations on your admission to eUniversity Africa. We look forward to supporting you throughout this exciting journey.</div>
      <div style="margin-top: 20px;">Sincerely,</div>
      <div>
        <strong>Name of Admission Officer.</strong><br>
        Director, Curriculum & Learning Experience, eUniversity Africa
      </div>
    </div>
  `;
};
