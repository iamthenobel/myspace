import React from "react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Terms &amp; Conditions</h1>
        <p className="text-gray-600 mb-4">
          By accessing and utilizing the MySpace platform, you implicitly agree to abide by the following comprehensive terms and conditions. We strongly urge you to review them meticulously to ensure full understanding.
        </p>

        ---

        <h2 className="text-xl font-semibold text-gray-700 mb-2">Purpose and Operational Status</h2>
        <p className="text-gray-600 mb-4">
          Presently, MySpace functions primarily as an <b>educational and training tool</b> specifically designed for students under the direct tutelage of <b>THE BOSS</b>. Its current iteration is tailored to facilitate coding exercises, project management, and collaborative learning within this pedagogical framework.
        </p>
        <p className=" mb-4 font-bold text-red-700 dark:text-red-400">
          <b>Important Notice Regarding Data Safety:</b> As MySpace is operating within a developmental and training capacity, we cannot, at this time, guarantee the absolute safety or confidentiality of user data. Users should exercise caution and discretion regarding the sensitivity of information uploaded or stored on the platform. This limitation will remain in effect until formal notice of a change in operational status and enhanced security protocols are publicly announced.
        </p>

        ---

        <h2 className="text-xl font-semibold text-gray-700 mb-2">User Conduct and Content Guidelines</h2>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>Users must be a minimum of <b>13 years of age</b> to register for and utilize any services offered by MySpace.</li>
          <li>The uploading, sharing, or distribution of content that is illegal, harmful, offensive, or copyrighted without explicit permission from the rights holder is strictly prohibited.</li>
          <li>All users are expected to uphold the principles of mutual respect and privacy, adhering to the rights and intellectual property of other members of the MySpace community.</li>
          <li>MySpace reserves the right to remove any content deemed in violation of these terms without prior notification.</li>
        </ul>

        ---

        <h2 className="text-xl font-semibold text-gray-700 mb-2">Account Management and Responsibilities</h2>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>You are solely responsible for maintaining the <b>confidentiality and security</b> of your login credentials, including your username and password.</li>
          <li>Any and all activities, actions, or content originating from your account are your sole responsibility. Users must promptly notify MySpace of any unauthorized use of their account or any other breach of security.</li>
        </ul>

        ---

        <h2 className="text-xl font-semibold text-gray-700 mb-2">Data Collection and Privacy Assurance</h2>
        <p className="text-gray-600 mb-4">
          Any personal information collected during the registration process, such as your <b>name and email address</b>, is gathered exclusively for the purpose of account creation and essential communication pertaining to your usage of MySpace. <b>We unequivocally state that this collected data will not be used for any external publication, marketing, or distributed to third parties.</b> Your privacy regarding this specific information is ensured.
        </p>

        ---

        <h2 className="text-xl font-semibold text-gray-700 mb-2">Disclaimer of Warranties and Limitation of Liability</h2>
        <ul className="list-disc pl-6 text-gray-600 mb-4">
          <li>MySpace is provided on an "as-is" and "as-available" basis. We disclaim all warranties, express or implied, including but not limited to, implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</li>
          <li>MySpace shall not be held liable for any direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to, loss of data, loss of profits, or business interruption, arising from your use or inability to use the service.</li>
          <li>The functionality, availability, and features of the MySpace service may be <b>modified, updated, or discontinued</b> at any time without prior notice, reflecting its ongoing developmental status.</li>
        </ul>

        ---

        <p className="text-gray-500 text-sm mt-6">
          For any inquiries, concerns, or requests regarding these terms or your use of MySpace, please do not hesitate to contact us directly at{' '}
          <a href="mailto:iamtheboss357286@gmail.com" className="text-indigo-600 hover:underline">
            iamtheboss357286@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Terms;