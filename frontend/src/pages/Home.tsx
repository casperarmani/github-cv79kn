import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, BarChart3, Video, ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/home/Navbar';
import { FeatureCard } from '@/components/home/FeatureCard';
import { GlassCard } from '@/components/home/GlassCard';
import { CompanySlider } from '@/components/home/CompanySlider';
import { RotatingText } from '@/components/home/RotatingText';
import { MetricsBanner } from '@/components/home/MetricsBanner';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section 
        className="relative w-full h-screen bg-no-repeat bg-cover bg-center flex items-center"
        style={{ 
          backgroundImage: 'url("https://cdn.discordapp.com/attachments/1109371168147914752/1307892127791054878/clear_tree.png?ex=67409236&is=673f40b6&hm=155baa8e57b1f0723cc7ca4547d967ceb0b88f28d9516b9a4dd2fb129ddeeb73&")',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="rounded-3xl bg-black/10 backdrop-blur-xl border border-white/10 p-12">
            <div className="flex justify-between items-center mb-8">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-6xl font-light mb-6 leading-tight text-white">
                AI-Powered Video Analysis<br />For Scaling Ads
              </h1>
              <RotatingText />
              <div className="mt-8 flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  className="bg-transparent text-white border-white hover:bg-white hover:text-black transition-all"
                >
                  See Demo
                  <Play className="ml-2 h-4 w-4" />
                </Button>
                <Link to="/app">
                  <Button 
                    className="bg-white text-black hover:bg-white/90"
                  >
                    Get Started For Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-sm font-light tracking-wider text-white/60 uppercase mb-4">
                  Trusted by industry leaders
                </p>
                <div className="overflow-hidden">
                  <CompanySlider />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MetricsBanner />
      
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <GlassCard className="p-8">
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative group">
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-16 h-16 text-white" />
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-light text-center mb-16">Traditional vs AI-Powered Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassCard className="p-8">
              <h3 className="text-xl font-medium mb-4">Traditional Method</h3>
              <ul className="space-y-4">
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Time-consuming manual review
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Limited insights
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  Human error prone
                </li>
              </ul>
            </GlassCard>
            <GlassCard className="p-8">
              <h3 className="text-xl font-medium mb-4">Our AI Solution</h3>
              <ul className="space-y-4">
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Instant automated analysis
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Deep data-driven insights
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  99.9% accuracy rate
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Why Choose Our Platform?</h2>
            <p className="text-xl text-gray-600">Experience the power of AI-driven video analysis</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Brain}
              title="Advanced AI Analysis"
              description="State-of-the-art algorithms analyze every frame of your content"
            />
            <FeatureCard
              icon={Zap}
              title="Real-time Processing"
              description="Get instant insights as your videos are processed"
            />
            <FeatureCard
              icon={BarChart3}
              title="Actionable Insights"
              description="Transform raw data into strategic decisions"
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to transform your video content</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard className="p-8">
              <div className="text-3xl font-light text-gray-400 mb-4">01</div>
              <h3 className="text-xl font-medium mb-2">Upload</h3>
              <p className="text-gray-600">Upload your video content to our secure platform</p>
            </GlassCard>
            <GlassCard className="p-8">
              <div className="text-3xl font-light text-gray-400 mb-4">02</div>
              <h3 className="text-xl font-medium mb-2">Analyze</h3>
              <p className="text-gray-600">Our AI processes and analyzes your content</p>
            </GlassCard>
            <GlassCard className="p-8">
              <div className="text-3xl font-light text-gray-400 mb-4">03</div>
              <h3 className="text-xl font-medium mb-2">Get Insights</h3>
              <p className="text-gray-600">Receive detailed analysis and actionable insights</p>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that's right for you</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard className="p-8">
              <div className="text-center">
                <h3 className="text-xl font-medium mb-2">Basic</h3>
                <div className="text-4xl font-light mb-6">$9<span className="text-lg text-gray-500">/mo</span></div>
                <ul className="space-y-3 mb-8 text-gray-600">
                  <li>5 hours of video analysis</li>
                  <li>Basic insights</li>
                  <li>Email support</li>
                </ul>
                <Button className="w-full">Get Started</Button>
              </div>
            </GlassCard>
            <GlassCard className="p-8 border-2 border-gray-800">
              <div className="text-center">
                <h3 className="text-xl font-medium mb-2">Pro</h3>
                <div className="text-4xl font-light mb-6">$29<span className="text-lg text-gray-500">/mo</span></div>
                <ul className="space-y-3 mb-8 text-gray-600">
                  <li>20 hours of video analysis</li>
                  <li>Advanced insights</li>
                  <li>Priority support</li>
                </ul>
                <Button className="w-full bg-gray-800">Get Started</Button>
              </div>
            </GlassCard>
            <GlassCard className="p-8">
              <div className="text-center">
                <h3 className="text-xl font-medium mb-2">Enterprise</h3>
                <div className="text-4xl font-light mb-6">Custom</div>
                <ul className="space-y-3 mb-8 text-gray-600">
                  <li>Unlimited analysis</li>
                  <li>Custom features</li>
                  <li>24/7 support</li>
                </ul>
                <Button variant="outline">Contact Sales</Button>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium mb-2">How accurate is the AI analysis?</h3>
              <p className="text-gray-600">Our AI maintains a 99.9% accuracy rate across all supported video formats.</p>
            </GlassCard>
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium mb-2">What video formats are supported?</h3>
              <p className="text-gray-600">We support all major video formats including MP4, AVI, MOV, and more.</p>
            </GlassCard>
            <GlassCard className="p-6">
              <h3 className="text-lg font-medium mb-2">How secure is my data?</h3>
              <p className="text-gray-600">We use enterprise-grade encryption and follow strict data protection protocols.</p>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard className="p-12">
            <h2 className="text-4xl font-light mb-4">Ready to Transform Your Video Content?</h2>
            <p className="text-xl text-gray-600 mb-8">Join thousands of users who are already analyzing their videos with AI</p>
            <div className="flex items-center justify-center space-x-4">
              <Link to="/app">
                <Button className="bg-gray-800 hover:bg-gray-900 text-white">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <p className="text-sm text-gray-600">
                Transforming video content with advanced AI analysis
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="#features">Features</Link></li>
                <li><Link to="#pricing">Pricing</Link></li>
                <li><Link to="#demo">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="#about">About</Link></li>
                <li><Link to="#blog">Blog</Link></li>
                <li><Link to="#careers">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="#privacy">Privacy</Link></li>
                <li><Link to="#terms">Terms</Link></li>
                <li><Link to="#security">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-600">© 2023 Video Analysis AI. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link to="#" className="text-gray-600 hover:text-gray-800">
                  Twitter
                </Link>
                <Link to="#" className="text-gray-600 hover:text-gray-800">
                  LinkedIn
                </Link>
                <Link to="#" className="text-gray-600 hover:text-gray-800">
                  GitHub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}