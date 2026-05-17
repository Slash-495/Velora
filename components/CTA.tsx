"use client";

import { Container } from "@/components/ui/Container";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote: "Velora made organizing my job hunt so much easier. The resume builder is intuitive and the ATS tips actually helped me land interviews.",
    name: "Sarah Chen",
    role: "CS Student",
    initials: "SC",
    color: "from-blue-500/20 to-purple-500/20"
  },
  {
    id: 2,
    quote: "I used to have 10 different Word docs for my resumes. Now I manage them all in one workspace. Absolutely love the clean interface.",
    name: "Alex Rivera",
    role: "Frontend Developer",
    initials: "AR",
    color: "from-emerald-500/20 to-teal-500/20"
  },
  {
    id: 3,
    quote: "The job tracker board is exactly what I needed. It's so satisfying to move applications to the 'Interviewing' column!",
    name: "James Wilson",
    role: "Data Analyst",
    initials: "JW",
    color: "from-orange-500/20 to-red-500/20"
  }
];

export function CTA() {
  return (
    <div className="relative overflow-hidden">
      {/* Testimonials Section */}
      <section className="py-24 relative z-10">
        <Container>
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight mb-4"
            >
              Loved by job seekers
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-text-secondary font-light"
            >
              Built to help students and professionals manage their careers more effectively.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
               <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-premium p-8 rounded-3xl relative group hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between"
              >
                <div>
                  <Quote className="w-8 h-8 text-primary/20 absolute top-6 right-6 transition-colors duration-300 group-hover:text-primary/40" />
                  <p className="text-text-secondary leading-relaxed mb-8 relative z-10">
                    "{testimonial.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center border border-white/10 shrink-0`}>
                    <span className="text-sm font-medium text-white/80">{testimonial.initials}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{testimonial.name}</h4>
                    <p className="text-xs text-text-muted">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative z-10 pb-32">
        {/* Background glow for CTA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <Container>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative card-premium border border-white/10 rounded-[3rem] p-8 sm:p-12 md:p-20 text-center overflow-hidden"
          >
            {/* Subtle inner glow top border */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            {/* Corner glowing accents */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit mb-8 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-primary-glow" />
                <span className="text-sm font-medium text-text-secondary">Get started for free</span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight mb-6 max-w-3xl mx-auto leading-[1.1]">
                Everything you need for your job hunt.
              </h2>
              
              <p className="text-xl text-text-secondary font-light mb-10 max-w-2xl mx-auto leading-relaxed">
                Start building resumes that stand out and organize your career journey with Velora today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="btn-glow group w-full sm:w-auto text-base px-8 py-4 rounded-xl">
                  Build Your Resume
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </button>
                <button className="btn-secondary w-full sm:w-auto text-base px-8 py-4 rounded-xl">
                  Explore Workspace
                </button>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
