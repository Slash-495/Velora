"use client";

import { ResumeContent } from "@/lib/mock-data";
import { ResumeThemeConfig } from "@/lib/templates";

interface TemplateProps {
  content: ResumeContent;
  themeConfig: ResumeThemeConfig;
}

export function DevTerminal({ content, themeConfig }: TemplateProps) {
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

  return (
    <div 
      className="bg-white text-black w-full h-full text-left"
      style={{
        fontFamily: "'Times New Roman', Times, serif", // The latex template uses classic serif
        fontSize: typography.fontSize,
        lineHeight: "1.2",
        color: "#000000",
        backgroundColor: "#ffffff",
        padding: "40px", // Classic tight margins for this template
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="font-bold tracking-tight" style={{ fontSize: "2.5em" }}>
            {cleanStr(content.personalInfo.fullName) || "Your Name"}
          </h1>
          {content.personalInfo.linkedin && (
            <div className="text-[0.95em] mt-1">
              Portfolio: {cleanStr(content.personalInfo.linkedin)}
            </div>
          )}
          {content.personalInfo.github && (
            <div className="text-[0.95em]">
              Github: {cleanStr(content.personalInfo.github)}
            </div>
          )}
        </div>
        <div className="text-right text-[0.95em] space-y-0.5">
          {content.personalInfo.email && (
            <div>Email: {cleanStr(content.personalInfo.email)}</div>
          )}
          {content.personalInfo.phone && (
            <div>Mobile: {cleanStr(content.personalInfo.phone)}</div>
          )}
        </div>
      </div>

      {/* Education */}
      {content.education.length > 0 && (
        <div className="mb-3">
          <h2 className="uppercase tracking-widest font-bold text-[1.1em] border-b border-black mb-2 pb-0.5" style={{ fontVariant: 'small-caps' }}>
            Education
          </h2>
          <div className="space-y-2">
            {content.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[1em]">{cleanStr(edu.school)}</span>
                  <span className="text-[0.95em]">{cleanStr(edu.startDate)} - {cleanStr(edu.endDate)}</span>
                </div>
                <div className="flex justify-between items-baseline italic text-[0.95em]">
                  <span>{cleanStr(edu.degree)} {edu.field ? `- ${cleanStr(edu.field)}` : ''}</span>
                  {edu.gpa && <span>GPA: {cleanStr(edu.gpa)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {content.skills.length > 0 && (
        <div className="mb-3">
          <h2 className="uppercase tracking-widest font-bold text-[1.1em] border-b border-black mb-2 pb-0.5" style={{ fontVariant: 'small-caps' }}>
            Skills Summary
          </h2>
          <div className="space-y-1">
            {content.skills.map((skill) => (
              <div key={skill.id} className="text-[0.95em] flex">
                <span className="font-bold w-[120px] shrink-0">{cleanStr(skill.category)}:</span>
                <span>{cleanStr(skill.items)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {content.experience.length > 0 && (
        <div className="mb-3">
          <h2 className="uppercase tracking-widest font-bold text-[1.1em] border-b border-black mb-2 pb-0.5" style={{ fontVariant: 'small-caps' }}>
            Experience
          </h2>
          <div className="space-y-3">
            {content.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[1em]">{cleanStr(exp.company)}</span>
                  <span className="text-[0.95em]">{cleanStr(exp.startDate)} - {exp.current ? 'Present' : cleanStr(exp.endDate)}</span>
                </div>
                <div className="italic text-[0.95em] mb-1">
                  {cleanStr(exp.role)}
                </div>
                <ul className="list-disc pl-4 space-y-0.5 m-0 text-[0.95em]">
                  {exp.description.split('\n').map((b, i) => {
                    const cleaned = cleanStr(b.replace(/^-/, '').trim());
                    if (!cleaned) return null;
                    return (
                      <li key={i} className="pl-1">
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

      {/* Projects */}
      {content.projects && content.projects.length > 0 && (
        <div className="mb-3">
          <h2 className="uppercase tracking-widest font-bold text-[1.1em] border-b border-black mb-2 pb-0.5" style={{ fontVariant: 'small-caps' }}>
            Projects
          </h2>
          <div className="space-y-2">
            {content.projects.map((proj) => (
              <div key={proj.id}>
                <div className="text-[0.95em]">
                  <span className="font-bold">{cleanStr(proj.name)}</span>
                  {proj.techStack && <span className="italic"> ({cleanStr(proj.techStack)})</span>}
                </div>
                <ul className="list-none pl-0 space-y-0.5 m-0 mt-0.5 text-[0.95em]">
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
  );
}
