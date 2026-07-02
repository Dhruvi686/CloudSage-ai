import { motion } from 'framer-motion';
import { BarChart3, Shield, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import { UploadWizard } from '../components/upload/UploadWizard';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Cost Intelligence',
    description: 'Real-time visibility into your cloud spend across EC2, S3, EBS, and RDS.',
  },
  {
    icon: Shield,
    title: 'FinOps Health Score',
    description: 'Automated scoring with actionable penalties and rewards.',
  },
  {
    icon: TrendingUp,
    title: 'Prophet Forecasting',
    description: 'Meta Prophet-powered cost projections with confidence intervals.',
  },
  {
    icon: FileText,
    title: 'Executive Reports',
    description: 'One-click PDF reports with savings roadmap and recommendations.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 mb-6">
              <span className="text-xs font-medium text-blue-400">Cloud Cost Intelligence Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-100 tracking-tight mb-4">
              Optimize your cloud.
              <br />
              <span className="text-blue-400">Save with confidence.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-400 mb-8">
              CloudSight AI analyzes your AWS infrastructure, identifies savings opportunities,
              and delivers explainable recommendations backed by Meta Prophet forecasting.
            </p>
            <button
              onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-5xl px-6 py-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="rounded-lg bg-blue-500/10 p-2.5 w-fit mb-4">
                <feature.icon className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">{feature.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Upload Section */}
      <div id="upload-section" className="mx-auto max-w-3xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8">
            <h2 className="text-xl font-semibold text-zinc-100 mb-1">Upload Infrastructure Data</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Upload your AWS resource CSVs to receive cost analysis, optimization recommendations, and forecasts.
            </p>
            <UploadWizard />
          </div>
        </motion.div>
      </div>

      {/* Existing data shortcut */}
      <div className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4"
        >
          Already have data? Go to Dashboard
        </button>
      </div>
    </div>
  );
}
