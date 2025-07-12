import React from "react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-4">
          At MySpace, we understand the importance of your privacy. This Privacy Policy details how we collect, utilize, maintain, and disclose information gathered from users of our platform. We encourage you to read this policy thoroughly to understand our practices regarding your data.
        </p>

        <hr className="my-6" />

        <h2 className="text-xl font-semibold text-gray-700 mb-2">Our Operational Context and Data Safety Disclaimer</h2>
        <p className="text-gray-600 mb-4">
          It's crucial to understand that MySpace is currently operating as a <b>developmental platform specifically for the education and training of students under the direct guidance of THE BOSS</b>. This means its primary purpose is pedagogical, focusing on coding, project management, and collaborative learning exercises.
        </p>
        <p className="mb-4 font-bold text-red-700 dark:text-red-400">
          <b>Please Note: Data Security for Training Environment</b>
          <br />
          Due to its present status as a teaching and training tool, MySpace's data security protocols are commensurate with a learning environment rather than a fully production-grade application. Consequently, we must explicitly state that <b>the absolute safety and confidentiality of user data cannot be guaranteed at this time</b>. We strongly advise against uploading highly sensitive, proprietary, or personal information that, if compromised, could lead to significant harm or privacy breaches. This limitation will remain in effect until MySpace transitions from its educational role and receives formal notification of enhanced security measures.
        </p>

        <hr className="my-6" />

        <h2 className="text-xl font-semibold text-gray-700 mb-2">Information We Collect</h2>
        <p className="text-gray-600 mb-2">MySpace collects the following types of information to provide and improve your experience:</p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>
            <b>Account Registration Data:</b> When you create an account, we collect essential information such as your <b>name and email address</b>. This data is used solely for the purpose of establishing and managing your user account and facilitating necessary communication regarding the platform. <b>We assure you that this specific information (name and email) will not be used for any external publication, marketing initiatives, or shared with any third parties.</b>
          </li>
          <li>
            <b>User-Generated Content:</b> This includes any files, documents, notes, images, videos, audio, or other media that you upload, create, or store within your MySpace folders.
          </li>
          <li>
            <b>Usage and Technical Data:</b> We automatically collect certain information about how you access and use the platform. This may include your IP address, browser type, operating system, access times, and pages viewed. This data helps us understand user behavior to enhance service functionality and troubleshoot issues.
          </li>
        </ul>

        <hr className="my-6" />

        <h2 className="text-xl font-semibold text-gray-700 mb-2">How We Utilize Your Information</h2>
        <p className="text-gray-600 mb-2">The information we collect serves several critical purposes:</p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>
            <b>Service Provision and Improvement:</b> Your data allows us to operate, maintain, and provide the core functionalities of MySpace. This includes enabling file storage, folder organization, and other features. We also use aggregated usage data to analyze and improve the overall performance, features, and user experience of the platform.
          </li>
          <li>
            <b>Communication and Support:</b> We may use your email address to send you important updates, announcements regarding service changes, technical support messages, or responses to your inquiries.
          </li>
          <li>
            <b>Security and Integrity:</b> Information is used to monitor for and prevent fraudulent activities, unauthorized access, and other security threats, helping us maintain the integrity and safety of MySpace for all users.
          </li>
          <li>
            <b>Internal Training and Debugging:</b> Given the platform's educational nature, data may be accessed by THE BOSS and authorized students solely for the purposes of debugging, developing new features, and understanding system behavior as part of the training curriculum.
          </li>
        </ul>

        <hr className="my-6" />

        <h2 className="text-xl font-semibold text-gray-700 mb-2">Your Rights Regarding Your Data</h2>
        <p className="text-600 mb-2">You retain certain rights concerning your personal information held by MySpace:</p>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>
            <b>Access, Update, and Deletion:</b> You have the ability to access, modify, or request the deletion of your personal data stored within your MySpace account at any time through the platform's settings or by contacting us directly.
          </li>
          <li>
            <b>Inquiry:</b> Should you have any privacy-related questions, concerns, or require further clarification on our data handling practices, please do not hesitate to contact us.
          </li>
        </ul>

        <hr className="my-6" />

        <h2 className="text-xl font-semibold text-gray-700 mb-2">Changes to This Privacy Policy</h2>
        <p className="text-gray-600 mb-4">
          MySpace reserves the right to update this Privacy Policy periodically to reflect changes in our practices or relevant regulations. Any revisions will be effective immediately upon posting the updated policy on this page. We encourage you to review this Privacy Policy regularly for any modifications.
        </p>

        ---

        <p className="text-gray-500 text-sm mt-6">
          For further details, questions, or to exercise your privacy rights, please reach out to us at{' '}
          <a href="mailto:iamtheboss357286@gmail.com" className="text-indigo-600 hover:underline">
            iamtheboss357286@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Privacy;