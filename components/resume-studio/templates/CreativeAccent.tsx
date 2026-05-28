"use client";

import { ResumeContent } from "@/lib/mock-data";
import { ResumeThemeConfig } from "@/lib/templates";

interface TemplateProps {
  content: ResumeContent;
  themeConfig: ResumeThemeConfig;
}

export function CreativeAccent({ content, themeConfig }: TemplateProps) {
  // Aggressive helper to clean up any escaped or raw latex characters that sneaked into JSON
  const cleanStr = (str: string) => {
    if (!str) return "";
    let s = str;
    s = s.replace(/\\textbf{([^}]*)}/g, "$1");
    s = s.replace(/\\textit{([^}]*)}/g, "$1");
    s = s.replace(/\\underline{([^}]*)}/g, "$1");
    s = s.replace(/\\[a-zA-Z]+/g, "");
    s = s.replace(/[{}]/g, "");
    s = s.replace(/\\/g, "");
    return s.trim();
  };

  const { typography, colors, layout } = themeConfig;

  // The 'curve' document class often uses a nice mix of sans-serif headers and serif body,
  // or fully custom. We'll simulate its signature rubric look here.

  const RubricTitle = ({ title }: { title: string }) => (
    <div className="flex items-center mb-4 mt-6">
      <div 
        className="text-[1.2em] font-bold uppercase tracking-wider pr-4"
        style={{ color: colors.accent, fontFamily: "Cabin, sans-serif" }}
      >
        {title}
      </div>
      <div className="flex-1 h-[2px]" style={{ backgroundColor: colors.accent, opacity: 0.2 }}></div>
    </div>
  );

  return (
    <div 
      className="bg-white text-black w-full h-full text-left flex flex-col"
      style={{
        fontFamily: "'Cochineal', 'Georgia', serif",
        fontSize: typography.fontSize,
        lineHeight: "1.4",
        color: colors.text,
        backgroundColor: colors.background,
        padding: "45px 50px", 
      }}
    >
      {/* Header Area */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 
            className="font-bold tracking-tight mb-2" 
            style={{ fontSize: "2.2em", fontFamily: "Cabin, sans-serif" }}
          >
            {cleanStr(content.personalInfo.fullName) || "Your Name Here, Ph.D."}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.9em]">
            {content.personalInfo.email && (
              <span className="flex items-center gap-1">
                <span style={{ color: colors.accent }}>✉</span> {cleanStr(content.personalInfo.email)}
              </span>
            )}
            {content.personalInfo.phone && (
              <span className="flex items-center gap-1">
                <span style={{ color: colors.accent }}>☎</span> {cleanStr(content.personalInfo.phone)}
              </span>
            )}
            {content.personalInfo.linkedin && (
              <span className="flex items-center gap-1">
                <span style={{ color: colors.accent }}>in</span> {cleanStr(content.personalInfo.linkedin)}
              </span>
            )}
            {content.personalInfo.github && (
              <span className="flex items-center gap-1">
                <span style={{ color: colors.accent }}>⌨</span> {cleanStr(content.personalInfo.github)}
              </span>
            )}
          </div>
        </div>
        
        {/* Photo Placeholder mimicking \photo */}
        <div className="w-20 h-24 bg-gray-200 border border-gray-300 rounded shadow-sm shrink-0 ml-4 flex items-center justify-center text-gray-400 text-[10px] uppercase overflow-hidden">
          {content.personalInfo.photoUrl ? (
            <img src={content.personalInfo.photoUrl} alt="Resume Photo" className="w-full h-full object-cover" />
          ) : (
            "Photo"
          )}
        </div>
      </div>

      <div className="text-center font-bold uppercase tracking-widest text-[1.4em] mb-4" style={{ fontFamily: "Cabin, sans-serif" }}>
        Curriculum Vitae
      </div>

      <div className="flex-1">
        
        {/* Summary (if exists) */}
        {content.personalInfo.summary && (
          <div className="mb-2 text-justify">
            {cleanStr(content.personalInfo.summary)}
          </div>
        )}

        {/* Employment / Experience */}
        {content.experience.length > 0 && (
          <div>
            <RubricTitle title="Employment" />
            <div className="space-y-4">
              {content.experience.map((exp) => (
                <div key={exp.id} className="relative pl-4 border-l-2" style={{ borderColor: colors.accent }}>
                  <div className="absolute w-2 h-2 rounded-full -left-[5px] top-1.5" style={{ backgroundColor: colors.accent }}></div>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold text-[1.05em]">{cleanStr(exp.company)}</span>
                    <span className="text-[0.9em] italic">{cleanStr(exp.startDate)} – {exp.current ? 'Present' : cleanStr(exp.endDate)}</span>
                  </div>
                  <div className="italic text-[0.95em] mb-1">
                    {cleanStr(exp.role)}
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 m-0 text-[0.95em]">
                    {exp.description.split('\n').map((b, i) => {
                      const cleaned = cleanStr(b.replace(/^-/, '').trim());
                      if (!cleaned) return null;
                      return (
                        <li key={i}>
                          <span className="text-justify">{cleaned}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {content.education.length > 0 && (
          <div>
            <RubricTitle title="Education" />
            <div className="space-y-3">
              {content.education.map((edu) => (
                <div key={edu.id} className="relative pl-4 border-l-2" style={{ borderColor: colors.accent }}>
                  <div className="absolute w-2 h-2 rounded-full -left-[5px] top-1.5" style={{ backgroundColor: colors.accent }}></div>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold text-[1.05em]">{cleanStr(edu.school)}</span>
                    <span className="text-[0.9em] italic">{cleanStr(edu.startDate)} – {cleanStr(edu.endDate)}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[0.95em]">
                    <span>{cleanStr(edu.degree)} {edu.field ? `in ${cleanStr(edu.field)}` : ''}</span>
                    {edu.gpa && <span>GPA: {cleanStr(edu.gpa)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {content.skills.length > 0 && (
          <div>
            <RubricTitle title="Skills" />
            <div className="grid grid-cols-1 gap-2">
              {content.skills.map((skill) => (
                <div key={skill.id} className="text-[0.95em] flex">
                  <span className="font-bold w-[140px] shrink-0" style={{ color: colors.accent }}>{cleanStr(skill.category)}</span>
                  <span className="flex-1">{cleanStr(skill.items)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects / Misc */}
        {content.projects && content.projects.length > 0 && (
          <div>
            <RubricTitle title="Miscellaneous / Projects" />
            <div className="space-y-3">
              {content.projects.map((proj) => (
                <div key={proj.id} className="relative pl-4 border-l-2" style={{ borderColor: colors.accent }}>
                  <div className="absolute w-2 h-2 rounded-full -left-[5px] top-1.5" style={{ backgroundColor: colors.accent }}></div>
                  <div className="text-[0.95em] mb-0.5">
                    <span className="font-bold text-[1.05em]">{cleanStr(proj.name)}</span>
                    {proj.techStack && <span className="italic"> ({cleanStr(proj.techStack)})</span>}
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 m-0 text-[0.95em]">
                    {proj.description.split('\n').map((b, i) => {
                      const cleaned = cleanStr(b.replace(/^-/, '').trim());
                      if (!cleaned) return null;
                      return (
                        <li key={i}>
                          <span className="text-justify">{cleaned}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
