"use client";

import { ResumeContent } from "@/lib/mock-data";
import { ResumeThemeConfig } from "@/lib/templates";

interface TemplateProps {
  content: ResumeContent;
  themeConfig: ResumeThemeConfig;
}

export function VeloraProfessional({ content, themeConfig }: TemplateProps) {
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

  // We map the accent color to the dividing lines or headings if desired.
  // For Velora Professional, we use a clean ATS layout with accent colors on headers.
  
  return (
    <div 
      className="bg-white text-black w-full h-full"
      style={{
        fontFamily: typography.fontFamily,
        fontSize: typography.fontSize,
        lineHeight: typography.lineHeight,
        color: colors.text,
        backgroundColor: colors.background,
        padding: layout.margins,
      }}
    >
      {/* Header */}
      <div className="text-center" style={{ marginBottom: layout.sectionSpacing }}>
        <h1 
          className="font-bold" 
          style={{ fontSize: "2.2em", marginBottom: "0.2em", color: colors.accent }}
        >
          {cleanStr(content.personalInfo.fullName) || "Your Name"}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-1.5" style={{ fontSize: "0.9em" }}>
          {content.personalInfo.phone && <span>{cleanStr(content.personalInfo.phone)} <span className="mx-1 text-gray-400">|</span></span>}
          {content.personalInfo.email && <span>{cleanStr(content.personalInfo.email)} <span className="mx-1 text-gray-400">|</span></span>}
          {content.personalInfo.linkedin && <span>LinkedIn <span className="mx-1 text-gray-400">|</span></span>}
          {content.personalInfo.github && <span>GitHub</span>}
        </div>
      </div>

      {/* Summary */}
      {content.personalInfo.summary && (
        <div style={{ marginBottom: layout.sectionSpacing }}>
          <h2 
            className="font-bold uppercase tracking-wider border-b-2" 
            style={{ fontSize: "1.2em", marginBottom: "0.4em", borderColor: colors.accent, color: colors.accent }}
          >
            Summary
          </h2>
          <p className="text-justify">
            {cleanStr(content.personalInfo.summary)}
          </p>
        </div>
      )}

      {/* Experience */}
      {content.experience.length > 0 && (
        <div style={{ marginBottom: layout.sectionSpacing }}>
          <h2 
            className="font-bold uppercase tracking-wider border-b-2" 
            style={{ fontSize: "1.2em", marginBottom: "0.4em", borderColor: colors.accent, color: colors.accent }}
          >
            Experience
          </h2>
          <div className="space-y-3">
            {content.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold" style={{ fontSize: "1.1em" }}>{cleanStr(exp.company)}</h3>
                  <span style={{ fontSize: "0.95em" }}>{cleanStr(exp.startDate)} -- {exp.current ? 'Present' : cleanStr(exp.endDate)}</span>
                </div>
                <div className="italic" style={{ fontSize: "0.95em", marginBottom: "0.2em" }}>
                  {cleanStr(exp.role)}
                </div>
                <ul className="list-none pl-0 space-y-0.5 m-0">
                  {exp.description.split('\n').map((b, i) => {
                    const cleaned = cleanStr(b.replace(/^-/, '').trim());
                    if (!cleaned) return null;
                    return (
                      <li key={i} className="flex">
                        <span className="mr-2" style={{ color: colors.accent }}>•</span>
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
        <div style={{ marginBottom: layout.sectionSpacing }}>
          <h2 
            className="font-bold uppercase tracking-wider border-b-2" 
            style={{ fontSize: "1.2em", marginBottom: "0.4em", borderColor: colors.accent, color: colors.accent }}
          >
            Projects
          </h2>
          <div className="space-y-3">
            {content.projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold" style={{ fontSize: "1.1em" }}>{cleanStr(proj.name)}</h3>
                  <span className="italic" style={{ fontSize: "0.95em" }}>{cleanStr(proj.techStack)}</span>
                </div>
                <ul className="list-none pl-0 space-y-0.5 m-0 mt-1">
                  {proj.description.split('\n').map((b, i) => {
                    const cleaned = cleanStr(b.replace(/^-/, '').trim());
                    if (!cleaned) return null;
                    return (
                      <li key={i} className="flex">
                        <span className="mr-2" style={{ color: colors.accent }}>•</span>
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
        <div style={{ marginBottom: layout.sectionSpacing }}>
          <h2 
            className="font-bold uppercase tracking-wider border-b-2" 
            style={{ fontSize: "1.2em", marginBottom: "0.4em", borderColor: colors.accent, color: colors.accent }}
          >
            Education
          </h2>
          <div className="space-y-2">
            {content.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold" style={{ fontSize: "1.1em" }}>{cleanStr(edu.school)}</h3>
                  <span style={{ fontSize: "0.95em" }}>{cleanStr(edu.startDate)} {edu.endDate ? `-- ${cleanStr(edu.endDate)}` : ''}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span style={{ fontSize: "0.95em" }}>{cleanStr(edu.degree)} {edu.field ? `in ${cleanStr(edu.field)}` : ''}</span>
                  {edu.gpa && <span style={{ fontSize: "0.95em" }}>GPA: {cleanStr(edu.gpa)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Skills */}
      {content.skills.length > 0 && (
        <div style={{ marginBottom: layout.sectionSpacing }}>
          <h2 
            className="font-bold uppercase tracking-wider border-b-2" 
            style={{ fontSize: "1.2em", marginBottom: "0.4em", borderColor: colors.accent, color: colors.accent }}
          >
            Technical Skills
          </h2>
          <div className="space-y-0.5">
            {content.skills.map((skill) => (
              <div key={skill.id}>
                <span className="font-bold" style={{ marginRight: "4px" }}>{cleanStr(skill.category)}:</span>
                <span>{cleanStr(skill.items)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
