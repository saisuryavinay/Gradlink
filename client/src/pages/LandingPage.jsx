import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap, Users, Briefcase, Star, Zap, Shield, CheckCircle,
  ArrowRight, ChevronRight, Mail, Linkedin, Github, BookOpen, Bell,
  TrendingUp, Award
} from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-xl">GradLink</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary hidden sm:inline-flex">Sign in</Link>
          <Link to="/register/student" className="btn-primary">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

function Feature({ icon: Icon, title, description, color }) {
  const colors = {
    blue: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600',
  };
  return (
    <motion.div variants={fadeUp} className="card p-6 hover:shadow-md transition-shadow duration-200">
      <div className={`inline-flex p-3 rounded-xl mb-4 ${colors[color] || colors.blue}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function BenefitCard({ role, color, items }) {
  const colors = {
    student: 'from-brand-600 to-blue-700',
    alumni: 'from-purple-600 to-indigo-700',
    admin: 'from-slate-700 to-slate-900',
  };
  return (
    <motion.div variants={fadeUp} className="card overflow-hidden">
      <div className={`bg-gradient-to-r ${colors[role]} p-6 text-white`}>
        <h3 className="text-xl font-bold mb-1 capitalize">For {role}s</h3>
        <p className="text-sm opacity-80">
          {role === 'student' && 'Launch your career with the right connections.'}
          {role === 'alumni' && 'Give back and stay connected to your roots.'}
          {role === 'admin' && 'Oversee and manage the entire platform.'}
        </p>
      </div>
      <ul className="p-6 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function Step({ number, title, description }) {
  return (
    <motion.div variants={fadeUp} className="flex gap-4">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-brand-50 dark:from-slate-800/50 to-white dark:to-slate-900">
        <motion.div
          initial="hidden" animate="show" variants={stagger}
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 badge-blue px-4 py-2 mb-6 text-sm font-medium">
            <GraduationCap className="h-4 w-4" />
            Alumni Networking & Student Career Platform
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
            Bridge the gap between{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-500">
              students & alumni
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10">
            GradLink connects college students with alumni for mentorship, career guidance, and real placement opportunities — all in one platform built for your institution.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register/student" className="btn-primary text-base px-6 py-3 shadow-lg shadow-brand-500/30">
              Register as Student <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register/alumni" className="btn-secondary text-base px-6 py-3">
              Register as Alumni <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Everything you need, in one place</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">A complete ecosystem for alumni networking and student career development.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Feature icon={Users} title="Alumni Discovery" description="Search and filter verified alumni by department, company, skills, and graduation year." color="blue" />
              <Feature icon={Star} title="Mentorship System" description="Students send structured mentorship requests. Alumni review, accept, or decline with a personalised note." color="purple" />
              <Feature icon={Briefcase} title="Job Opportunities" description="Placement drives, off-campus jobs, and alumni-referred vacancies all in one organised listing." color="green" />
              <Feature icon={Zap} title="AI Resume Analyzer" description="Upload your resume and get AI-powered skill gap analysis, match scores, and improvement suggestions powered by Google Gemini." color="orange" />
              <Feature icon={Bell} title="Real-time Notifications" description="Instant in-app alerts for mentorship responses, job approvals, and important platform activity." color="yellow" />
              <Feature icon={Shield} title="Admin Controls" description="Powerful management tools for administrators — approve jobs, moderate updates, manage accounts, and export reports." color="teal" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">How GradLink works</h2>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-8">
              <Step number="1" title="Register with your college email" description="Use your official @acet.ac.in, @acoe.edu.in, or @aec.edu.in email. Verify via OTP — no manual approval needed." />
              <Step number="2" title="Complete your profile" description="Students add academic details, skills, and preferences. Alumni add their career journey and mentorship interests." />
              <Step number="3" title="Connect and grow" description="Browse alumni, send mentorship requests, apply to curated job listings, and get personalised AI resume feedback." />
              <Step number="4" title="Track your progress" description="Monitor application status, mentorship history, and placement updates all from your personalised dashboard." />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Built for every role</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              <BenefitCard role="student" items={[
                'Browse and connect with verified alumni',
                'Request mentorship guidance',
                'Apply to placement drives and job openings',
                'Analyze your resume with AI',
                'Track all your applications in one place',
                'Get notified about upcoming deadlines',
              ]} />
              <BenefitCard role="alumni" items={[
                'Stay connected to your college community',
                'Mentor students in your field',
                'Post job vacancies from your company',
                'Share professional updates and milestones',
                'Help shape the next generation',
              ]} />
              <BenefitCard role="admin" items={[
                'Manage student and alumni accounts',
                'Approve job postings and updates',
                'Create placement and event announcements',
                'Monitor mentorship activity',
                'Export placement reports as PDF and CSV',
              ]} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-brand-600 to-blue-700">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-blue-100 mb-8 text-lg">
            Join GradLink with your official college email and take the next step in your career.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            <Link to="/register/student" className="bg-white text-brand-700 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2">
              Register as Student <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="border border-white/40 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-lg transition-colors">
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">GradLink</span>
          </div>
          <p className="text-sm">Alumni Networking & Student Career Platform</p>
          <div className="flex gap-4">
            <Link to="/login" className="text-sm hover:text-white transition-colors">Sign In</Link>
            <Link to="/register/student" className="text-sm hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
