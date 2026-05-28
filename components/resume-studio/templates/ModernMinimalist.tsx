"use client";

import { ResumeContent } from "@/lib/mock-data";
import { ResumeThemeConfig } from "@/lib/templates";

interface TemplateProps {
  content: ResumeContent;
  themeConfig: ResumeThemeConfig;
}

export function ModernMinimalist({ content, themeConfig }: TemplateProps) {
  // Extract accent color to use it dynamically or fallback to a default grey/blue
  const accentColor = themeConfig.accentColor || "#00b4d8";
  
  return (
    <div className="w-full h-full bg-white text-gray-800 font-sans text-xs flex flex-col relative" style={{ fontFamily: "Raleway, sans-serif" }}>
      
      {/* Top Header Block */}
      <div className="w-full py-8 text-center bg-[#4a4a4a] text-white">
        <h1 className="text-4xl font-light tracking-wide mb-2">{content.personalInfo.fullName}</h1>
        <p className="text-sm font-light text-gray-300">Captain / Lead Developer</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-[30%] bg-[#f0f0f0] p-6 flex flex-col gap-6 shrink-0 h-full border-r border-gray-200">
          
          {/* Photo */}
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-300">
            {content.personalInfo.photoUrl ? (
              <img src={content.personalInfo.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 uppercase tracking-widest bg-gray-200">
                Photo
              </div>
            )}
          </div>

          {/* About Me */}
          <div className="text-right">
            <h2 className="inline-block px-2 py-1 text-white font-bold text-[10px] uppercase tracking-wider mb-2" style={{ backgroundColor: accentColor }}>
              About me
            </h2>
            <p className="text-[10px] leading-relaxed text-gray-600">
              {content.personalInfo.summary || "Passionate software engineer with 5+ years of experience building scalable web applications."}
            </p>
          </div>

          {/* Personal */}
          <div className="text-right">
            <h2 className="inline-block px-2 py-1 text-white font-bold text-[10px] uppercase tracking-wider mb-2" style={{ backgroundColor: accentColor }}>
              personal
            </h2>
            <div className="text-[10px] text-gray-600 leading-tight space-y-1">
              <p>{content.personalInfo.fullName}</p>
              <p>nationality: Earth</p>
              <p>{content.personalInfo.location || "San Francisco, CA"}</p>
            </div>
          </div>

          {/* Contact Icons */}
          <div className="mt-auto space-y-2 text-right">
             <div className="flex items-center justify-end gap-2">
               <span className="text-[10px] text-gray-700">{content.personalInfo.email}</span>
               <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]" style={{ backgroundColor: accentColor }}>@</div>
             </div>
             <div className="flex items-center justify-end gap-2">
               <span className="text-[10px] text-gray-700">{content.personalInfo.phone}</span>
               <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]" style={{ backgroundColor: accentColor }}>P</div>
             </div>
             {content.personalInfo.linkedin && (
               <div className="flex items-center justify-end gap-2">
                 <span className="text-[10px] text-gray-700">{content.personalInfo.linkedin}</span>
                 <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]" style={{ backgroundColor: accentColor }}>in</div>
               </div>
             )}
             {content.personalInfo.github && (
               <div className="flex items-center justify-end gap-2">
                 <span className="text-[10px] text-gray-700">{content.personalInfo.github}</span>
                 <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]" style={{ backgroundColor: accentColor }}>gh</div>
               </div>
             )}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-[70%] p-8 overflow-y-auto">
          
          {/* Experience */}
          <div className="mb-6">
            <h2 className="text-lg uppercase tracking-wider mb-3 text-gray-800 border-b border-gray-300 pb-1" style={{ fontFamily: "small-caps" }}>
              Short Resumé
            </h2>
            <div className="space-y-4">
              {content.experience.map((exp, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-16 text-[9px] text-gray-500 text-right pt-1 shrink-0">
                    {exp.startDate} -- {exp.endDate || "Present"}
                  </div>
                  <div className="border-l border-gray-300 pl-4 flex-1">
                    <h3 className="font-bold text-gray-800">{exp.company}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{exp.role} &middot; {exp.location}</p>
                    <p className="text-[10px] text-gray-600 leading-relaxed">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* Education */}
            <div>
              <h2 className="text-lg uppercase tracking-wider mb-3 text-gray-800 border-b border-gray-300 pb-1" style={{ fontFamily: "small-caps" }}>
                Degrees
              </h2>
              <div className="space-y-3">
                {content.education.map((edu, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 text-[9px] text-gray-500 text-right pt-0.5 shrink-0">
                      {edu.endDate?.split(" ")[1] || "2020"}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-[11px]">{edu.degree}</h3>
                      <p className="text-[9px] text-gray-500 uppercase">{edu.field} &middot; {edu.school}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Programming / Skills */}
            <div>
              <h2 className="text-lg uppercase tracking-wider mb-3 text-gray-800 border-b border-gray-300 pb-1" style={{ fontFamily: "small-caps" }}>
                Programming
              </h2>
              <div className="space-y-2">
                {content.skills.map((skillGroup, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-20 text-right">
                      <span className="bg-gray-300 px-1.5 py-0.5 text-[9px] font-bold text-gray-700 rounded-sm">
                        {skillGroup.category.toLowerCase()}
                      </span>
                    </div>
                    {/* Visual Bar representation */}
                    <div className="flex-1 h-1.5 bg-gray-200 relative">
                      <div className="absolute top-0 left-0 h-full" style={{ width: `${Math.max(30, 100 - i * 15)}%`, backgroundColor: accentColor }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="mb-6">
            <h2 className="text-lg uppercase tracking-wider mb-3 text-gray-800 border-b border-gray-300 pb-1" style={{ fontFamily: "small-caps" }}>
              Curriculum / Projects
            </h2>
            <div className="space-y-4">
              {content.projects.map((proj, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-16 text-[9px] text-gray-500 text-right pt-1 shrink-0">
                    2023
                  </div>
                  <div className="border-l border-gray-300 pl-4 flex-1">
                    <h3 className="font-bold text-gray-800">{proj.name}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{proj.techStack}</p>
                    <p className="text-[10px] text-gray-600 leading-relaxed">{proj.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
