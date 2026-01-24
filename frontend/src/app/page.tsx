'use client'

import { useState } from 'react';
import { FaRocket, FaUsers, FaChartLine, FaMagic, FaSearch, FaStar, FaBriefcase, FaGraduationCap, FaHeart, FaBell, FaShieldAlt, FaTrophy, FaHandshake, FaLightbulb, FaCheckCircle, FaArrowRight, FaPlay } from 'react-icons/fa';
import styles from './page.module.css';
import { FiBriefcase, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

const recruiterFeatures = [
  {
    id: 1,
    title: 'Post a Job',
    description: 'Post once. Instantly reach candidates everywhere.',
    icon: <FaRocket className="text-2xl" />,
    color: '#4f46e5'
  },
  {
    id: 2,
    title: 'Attract & Manage',
    description: 'Track applicants and send offers — all in one place.',
    icon: <FaUsers className="text-2xl" />,
    color: '#7c3aed'
  },
  {
    id: 3,
    title: 'Get Insights',
    description: 'Monitor performance and get better over time.',
    icon: <FaChartLine className="text-2xl" />,
    color: '#10b981'
  },
  {
    id: 4,
    title: 'AI Automation',
    description: 'Let AI handle the repetitive tasks for you.',
    icon: <FaMagic className="text-2xl" />,
    color: '#f59e0b'
  },
];

const candidateFeatures = [
  {
    id: 1,
    title: 'Smart Job Matching',
    description: 'AI finds jobs that perfectly match your skills and goals.',
    icon: <FaSearch className="text-2xl" />,
    color: '#10b981'
  },
  {
    id: 2,
    title: 'Profile Optimization',
    description: 'Get personalized tips to make your profile shine.',
    icon: <FaStar className="text-2xl" />,
    color: '#f59e0b'
  },
  {
    id: 3,
    title: 'Career Growth',
    description: 'Track your progress and unlock new opportunities.',
    icon: <FaTrophy className="text-2xl" />,
    color: '#4f46e5'
  },
  {
    id: 4,
    title: 'Direct Connect',
    description: 'Skip the noise and connect directly with hiring teams.',
    icon: <FaHandshake className="text-2xl" />,
    color: '#ef4444'
  },
];

export default function DynamicLandingPage() {
  const [selected, setSelected] = useState('recruiter');
  const router = useRouter()

  const getHeroContent = () => {
    if (selected === 'recruiter') {
      return {
        title: 'Take the Next Big Leap in Hiring with AI',
        subtitle: 'Our smart system helps you manage all your hiring in one place. Track every applicant, share feedback with your team, and let AI handle the boring stuff—so you can focus on choosing the right people.',
        primaryCTA: 'Start Hiring Smarter',
        secondaryCTA: 'See How It Works',
        image: '/home_hero_image.png',
        imageAlt: 'AI Hiring Platform Dashboard'
      };
    } else {
      return {
        title: 'Land Your Dream Job with AI-Powered Matching',
        subtitle: 'Stop scrolling through endless job boards. Our AI learns what you want and connects you with opportunities that actually fit your goals, skills, and career path.',
        primaryCTA: 'Find My Dream Job',
        secondaryCTA: 'Take Career Quiz',
        image: '/home_hero_image.png',
        imageAlt: 'Career Growth Dashboard'
      };
    }
  };

  const getFeaturesContent = () => {
    if (selected === 'recruiter') {
      return {
        title: 'Cut Your Hiring Time by 70%',
        description: 'Our AI handles all the repetitive tasks while keeping you in control at every step. You make the final call; we just make it faster and easier.',
        features: recruiterFeatures
      };
    } else {
      return {
        title: 'Get Matched with Your Perfect Role',
        description: 'No more spray-and-pray applications. Our AI understands your unique value and matches you with companies that need exactly what you offer.',
        features: candidateFeatures
      };
    }
  };

  const heroContent = getHeroContent();
  const featuresContent = getFeaturesContent();

  return (
    <div className="homepage-content w-full overflow-x-hidden text-slate-800 font-sans mb-12" >
      {/* Hero Section */}
      <div className="bg-linear-to-br from-slate-50 to-slate-100 pb-16 relative rounded-tr-lg rounded-tl-lg pt-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-60" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23e2e8f0' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }} />

        {/* Toggle */}
        <div className={styles.toggleContainer}>
          <div className={styles.toggle}>
            <div
              className={`${styles.slider} ${selected === 'candidate' ? styles.slideRight : ''}`}
            />
            <div
              className={`${styles.option} ${selected === 'recruiter' ? styles.selected : ''}`}
              data-label="Job provider"
              onClick={() => setSelected('recruiter')}
            >
              <FiBriefcase className={styles.optionIcon} />
              <span>Job provider</span>
            </div>
            <div
              className={`${styles.option} ${selected === 'candidate' ? styles.selected : ''}`}
              data-label="Job seeker"
              onClick={() => setSelected('candidate')}
            >
              <FiUser className={styles.optionIcon} />
              <span>Job seeker</span>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6 text-slate-800">
                {heroContent.title.split(' ').map((word, index) => {
                  if ((selected === 'recruiter' && (word === 'Leap' || word === 'Hiring' || word === 'AI')) ||
                    (selected === 'candidate' && (word === 'Dream' || word === 'Job' || word === 'AI-Powered' || word === 'Matching'))) {
                    return (
                      <span key={index} className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        {word}{' '}
                      </span>
                    );
                  }
                  return word + ' ';
                })}
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl">
                {heroContent.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-7 py-3.5 rounded-lg text-base font-semibold hover:scale-105 hover:shadow-lg transition-all duration-300 flex items-center gap-2 justify-center">
                  {heroContent.primaryCTA}
                  <FaArrowRight className="text-sm" />
                </button>
                <button className="bg-white text-indigo-600 border border-slate-200 px-7 py-3.5 rounded-lg text-base font-semibold hover:bg-slate-50 hover:scale-105 hover:shadow-md transition-all duration-300 flex items-center gap-2 justify-center">
                  <FaPlay className="text-sm" />
                  {heroContent.secondaryCTA}
                </button>
              </div>
            </div>
            <div className="flex-1 mt-8 lg:mt-0">
              <div className="max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={heroContent.image}
                  alt={heroContent.imageAlt}
                  className="w-full h-auto block"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beta Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white p-4 text-center rounded-br-lg rounded-bl-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
          <span className="bg-white text-amber-700 px-3 py-1 rounded-full font-bold text-sm">
            BETA
          </span>
          <p className="font-semibold">
            Be a Part of Something Revolutionary
          </p>
          <button className="bg-white/20 text-white border border-white/30 px-5 py-2 rounded-full font-semibold hover:bg-white/30 hover:scale-105 transition-all duration-300">
            Join Our Beta Program
          </button>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold leading-tight mb-6 text-slate-800">
              {featuresContent.title.split(' ').map((word, index) => {
                if ((selected === 'recruiter' && (word === 'Hiring' || word === 'Time' || word === '70%')) ||
                  (selected === 'candidate' && (word === 'Matched' || word === 'Perfect' || word === 'Role'))) {
                  return (
                    <span key={index} className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                      {word}{' '}
                    </span>
                  );
                }
                return word + ' ';
              })}
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              {featuresContent.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuresContent.features.map((feature) => (
              <div
                key={feature.id}
                className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:scale-105 hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <div
                  className="absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:w-2"
                  style={{ backgroundColor: feature.color }}
                />
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: feature.color + '20', color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Section based on user type */}
      {selected === 'recruiter' ? (
        // Recruiter-specific section
        <section className="py-24 bg-slate-50 rounded-lg">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <div className="max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/home_section2_image.png" alt="Team collaboration" className="w-full h-auto" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-4xl font-extrabold leading-tight mb-6 text-slate-800">
                  Works for <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Startups</span>, Small Teams, and Growing Companies
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  Whether you're hiring your first person or your fiftieth, our platform grows with you. Add your teammates, create jobs, and track progress—all under one company account.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-4 text-lg text-slate-700">
                    <FaCheckCircle className="text-indigo-500 text-xl flex-shrink-0" />
                    <span>Reduce time-to-hire by 70%</span>
                  </li>
                  <li className="flex items-center gap-4 text-lg text-slate-700">
                    <FaCheckCircle className="text-indigo-500 text-xl flex-shrink-0" />
                    <span>Collaborate with your entire team</span>
                  </li>
                  <li className="flex items-center gap-4 text-lg text-slate-700">
                    <FaCheckCircle className="text-indigo-500 text-xl flex-shrink-0" />
                    <span>AI-powered candidate matching</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-3">
                  <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-2 justify-center">
                    Start Your Free Trial
                    <FaArrowRight className="text-sm" />
                  </button>
                  <p className="text-sm text-slate-500 text-center">
                    Let Our AI Handle the Busywork so you can focus on what matters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        // Candidate-specific section
        <section className="py-24 bg-slate-50 rounded-lg">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="flex-1">
                <div className="max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/home_section2_image.png" alt="Career success dashboard" className="w-full h-auto" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-4xl font-extrabold leading-tight mb-6 text-slate-800">
                  Build Your <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Career Story</span> with Confidence
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  Stop feeling lost in your career journey. Our AI learns your strengths, tracks your growth, and connects you with opportunities that align with your ambitions.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-4 text-lg text-slate-700">
                    <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
                    <span>Get personalized career insights</span>
                  </li>
                  <li className="flex items-center gap-4 text-lg text-slate-700">
                    <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
                    <span>Never miss the perfect opportunity</span>
                  </li>
                  <li className="flex items-center gap-4 text-lg text-slate-700">
                    <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
                    <span>Skip the spam, get quality matches</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-3">
                  <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-2 justify-center">
                    Create Your Profile
                    <FaArrowRight className="text-sm" />
                  </button>
                  <p className="text-sm text-slate-500 text-center">
                    Join thousands of professionals who found their dream job with us.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Success Stories Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold leading-tight mb-6 text-slate-800">
              {selected === 'recruiter' ? (
                <>Success Stories from <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Growing Companies</span></>
              ) : (
                <>Real Stories from <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Career Champions</span></>
              )}
            </h2>
            <p className="text-lg text-slate-600">
              {selected === 'recruiter'
                ? 'See how teams like yours are transforming their hiring process'
                : 'Discover how professionals like you are landing their dream jobs'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {selected === 'recruiter' ? (
              // Recruiter testimonials
              <>
                <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                      S
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-slate-800">Sarah Chen</h4>
                      <p className="text-slate-600 text-sm">Startup Founder</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "Cut our hiring time from 8 weeks to 2 weeks. The AI filtering saved us countless hours reviewing unqualified resumes."
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      M
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-slate-800">Marcus Johnson</h4>
                      <p className="text-slate-600 text-sm">HR Director</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "Finally, a platform that gets it. Our team collaboration improved 10x and we hired 3 amazing developers last month."
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-slate-800">Alex Rivera</h4>
                      <p className="text-slate-600 text-sm">Tech Lead</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "The AI insights helped us understand why our previous hires didn't work out. Now we're making better decisions."
                  </p>
                </div>
              </>
            ) : (
              // Candidate testimonials
              <>
                <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      J
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-slate-800">Jessica Park</h4>
                      <p className="text-slate-600 text-sm">Software Engineer</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "Landed my dream job in 2 weeks! The AI matched me with a startup that valued my unique background in design + code."
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      D
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-slate-800">David Kim</h4>
                      <p className="text-slate-600 text-sm">Product Manager</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "No more spray-and-pray applications. Every opportunity was relevant, and I got responses from 80% of my applications."
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      R
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-slate-800">Rachel Torres</h4>
                      <p className="text-slate-600 text-sm">Marketing Lead</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "The career insights were a game-changer. I finally understood my strengths and found a role that plays to them perfectly."
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-lg max-h-fit">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold leading-tight mb-6">
            {selected === 'recruiter'
              ? 'Ready to Transform Your Hiring Process?'
              : 'Ready to Accelerate Your Career Journey?'
            }
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {selected === 'recruiter'
              ? 'Join hundreds of companies already hiring smarter with AI. Start your free trial today.'
              : 'Join thousands of professionals who found their perfect role. Create your profile in 2 minutes.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-bold hover:scale-105 hover:shadow-lg transition-all duration-300 flex items-center gap-2 justify-center">
              {selected === 'recruiter' ? 'Start Free Trial' : 'Create My Profile'}
              <FaArrowRight className="text-base" />
            </button>
            <button className="bg-white/20 text-white border border-white/30 px-8 py-4 rounded-lg text-lg font-bold hover:bg-white/30 hover:scale-105 transition-all duration-300 flex items-center gap-2 justify-center">
              <FaPlay className="text-base" />
              {selected === 'recruiter' ? 'Schedule Demo' : 'Take Career Quiz'}
            </button>
          </div>
          <p className="text-sm opacity-75 mt-6">
            {selected === 'recruiter'
              ? '✨ No credit card required • Set up in under 5 minutes'
              : '✨ 100% free to start • AI career insights included'
            }
          </p>
        </div>
      </section>
    </div>
  );
}