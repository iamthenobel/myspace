import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  FaFolderPlus, 
  FaSignInAlt, 
  FaRocket, 
  FaShieldAlt,
  FaCloudUploadAlt,
  FaMobileAlt,
  FaLock,
  FaUsers,
  FaChartLine
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const FeatureCard = ({ icon, title, description, delay }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.6, delay: delay * 0.15 }}
      className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
    >
      <div className="text-indigo-600 text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

const LandingPage = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const features = [
    {
      icon: <FaCloudUploadAlt />,
      title: "Unlimited Storage",
      description: "Store all your files without worrying about space limitations"
    },
    {
      icon: <FaShieldAlt />,
      title: "Bank-Level Security",
      description: "Military-grade encryption protects your sensitive documents"
    },
    {
      icon: <FaMobileAlt />,
      title: "Anywhere Access",
      description: "Available on all your devices with seamless synchronization"
    },
    {
      icon: <FaLock />,
      title: "Private by Design",
      description: "Your data belongs to you - we don't sell or share it"
    },
    {
      icon: <FaUsers />,
      title: "Team Collaboration",
      description: "Share files securely with colleagues and clients"
    },
    {
      icon: <FaChartLine />,
      title: "Smart Organization",
      description: "AI-powered tagging and search for effortless file management"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-6">
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{
                y: [0, -10, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block mb-6"
            >
              <FaRocket className="text-5xl text-indigo-600" />
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
              <span className="text-indigo-600">MySpace</span> — Your Digital Workspace
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              The ultimate platform to store, organize, and share your notes, documents, and media files with enterprise-grade security.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              to="/signup"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              <FaFolderPlus />
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl border-2 border-indigo-100 hover:border-indigo-200 transition-all transform hover:-translate-y-1 shadow-sm"
            >
              <FaSignInAlt />
              Existing Account
            </Link>
          </motion.div>

          {/* Arrow removed as requested */}
        </div>
      </section>

      {/* Features Section */}
      <section ref={ref} className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            animate={controls}
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Why Choose <span className="text-indigo-600">MySpace</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Designed for professionals who demand reliability, security, and seamless workflow integration
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard 
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={index}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-indigo-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Ready to Transform Your Digital Workflow?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Join thousands of professionals who trust MySpace with their important documents and files.
            </p>
            <div className="flex justify-center">
              <Link
                to="/signup"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <FaRocket />
                Start Your 14-Day Free Trial
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Join Us Today Section */}
      <section className="py-16 px-6 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-indigo-50 rounded-xl shadow-lg p-8 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-indigo-700 mb-4">Join Us Today</h2>
            <p className="text-lg text-gray-700 mb-4">Become a part of <span className="font-semibold text-indigo-600">THE BOSS</span> organization and collaborate, learn, and grow with passionate developers and students.</p>
            <a href="mailto:iamtheboss357286@gmail.com?subject=Join%20THE%20BOSS%20Organization" className="inline-block px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg text-lg">
              Send a Message to Join
            </a>
            <p className="text-sm text-gray-500 mt-4">We welcome feedback, collaboration, and new members. Reach out and let's build something great together!</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 mb-4 md:mb-0">
            © {new Date().getFullYear()} MySpace. All rights reserved.
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-4 flex items-center gap-4 mb-4 md:mb-0">
              <img src="https://avatars.githubusercontent.com/u/47414652?v=4" alt="olamilekan21 avatar" className="w-12 h-12 rounded-full border border-indigo-100 shadow" />
              <div>
                <div className="font-semibold text-gray-800 text-base mb-1">About the developer</div>
                <a href="https://github.com/iamthenobel" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium text-sm flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 inline-block mr-1 text-indigo-500"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.529 2.341 1.088 2.91.833.091-.646.35-1.088.636-1.34-2.221-.253-4.555-1.111-4.555-4.945 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.338 1.909-1.294 2.748-1.025 2.748-1.025.546 1.378.202 2.397.099 2.65.64.699 1.028 1.592 1.028 2.683 0 3.842-2.337 4.688-4.566 4.937.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .268.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                  <span className="text-base">I am THE BOSS</span>
                </a>
                <div className="text-xs text-gray-500 mt-1">Fullstack Developer &amp; Open Source Enthusiast</div>
              </div>
            </div>
            {/* Contact Card */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-4 flex items-center gap-4 mb-4 md:mb-0">
              <img src="https://cdn-icons-png.flaticon.com/512/561/561127.png" alt="Contact Email" className="w-12 h-12 rounded-full border border-indigo-100 shadow" />
              <div>
                <div className="font-semibold text-gray-800 text-base mb-1">Contact &amp; Feedback</div>
                <a href="mailto:iamtheboss357286@gmail.com" className="text-indigo-600 hover:underline font-medium text-sm flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 inline-block mr-1 text-indigo-500"><path d="M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm2 0v.217l8 5.053 8-5.053V4H4zm16 2.383-7.447 4.7a2 2 0 0 1-2.106 0L4 6.383V20h16V6.383z"/></svg>
                  <span className="text-base">iamtheboss357286@gmail.com</span>
                </a>
                <div className="text-xs text-gray-500 mt-1">For feedback, collaboration, or any inquiries</div>
              </div>
            </div>
            <Link to="/privacy" className="text-gray-600 hover:text-indigo-600 transition">
              Privacy
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-indigo-600 transition">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;