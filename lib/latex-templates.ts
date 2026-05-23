import { ResumeContent } from "./mock-data";

export function generateDefaultLatex(content: ResumeContent): string {
  const personalInfo = `\\begin{center}
    {\\Large \\textbf{${escapeLatex(content.personalInfo.fullName || "Your Name")}}} \\\\
    ${content.personalInfo.phone ? `${escapeLatex(content.personalInfo.phone)} \\;|\\;` : ''}
    ${content.personalInfo.email ? `\\href{mailto:${escapeLatex(content.personalInfo.email)}}{${escapeLatex(content.personalInfo.email)}} \\;|\\;` : ''}
    ${content.personalInfo.linkedin ? `\\href{https://${escapeLatex(content.personalInfo.linkedin)}}{LinkedIn} \\;|\\;` : ''}
    ${content.personalInfo.github ? `\\href{https://${escapeLatex(content.personalInfo.github)}}{GitHub}` : ''}
\\end{center}
\\vspace{-3mm}`;

  const summary = content.personalInfo.summary ? `
\\section*{Summary}
${escapeLatex(content.personalInfo.summary)}
` : '';

  const education = content.education.length > 0 ? `
\\section*{Education}
${content.education.map(edu => `
\\noindent
\\textbf{${escapeLatex(edu.school)}} \\hfill ${escapeLatex(edu.startDate)} -- ${escapeLatex(edu.endDate)} \\\\
${escapeLatex(edu.degree)} in ${escapeLatex(edu.field)} \\hfill GPA: ${escapeLatex(edu.gpa)}
`).join('\n')}
` : '';

  const skills = content.skills.length > 0 ? `
\\section*{Technical Skills}
${content.skills.map(skill => `
\\textbf{${escapeLatex(skill.category)}}: ${escapeLatex(skill.items)} \\\\`).join('\n')}
` : '';

  const projects = content.projects.length > 0 ? `
\\section*{Projects}
${content.projects.map(proj => `
\\noindent
\\textbf{${escapeLatex(proj.name)}} \\hfill \\textit{${escapeLatex(proj.techStack)}} \\\\
\\vspace{-4pt}
\\begin{itemize}
${proj.description.split('\n').filter(b => b.trim().startsWith('-')).map(b => `  \\item ${escapeLatex(b.replace('-', '').trim())}`).join('\n')}
\\end{itemize}
`).join('\n')}
` : '';

  const experience = content.experience.length > 0 ? `
\\section*{Experience}
${content.experience.map(exp => `
\\noindent
\\textbf{${escapeLatex(exp.company)}} \\hfill ${escapeLatex(exp.startDate)} -- ${exp.current ? 'Present' : escapeLatex(exp.endDate)} \\\\
\\textit{${escapeLatex(exp.role)}} \\\\
\\vspace{-4pt}
\\begin{itemize}
${exp.description.split('\n').filter(b => b.trim().startsWith('-')).map(b => `  \\item ${escapeLatex(b.replace('-', '').trim())}`).join('\n')}
\\end{itemize}
`).join('\n')}
` : '';

  return `\\documentclass[a4paper,10pt]{article}

\\usepackage[left=0.6in,right=0.6in,top=0.55in,bottom=0.5in]{geometry}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{titlesec}

\\pagenumbering{gobble}

\\titlespacing*{\\section}{0pt}{4pt}{3pt}
\\setlist[itemize]{noitemsep, topsep=1pt, leftmargin=*}

\\begin{document}

${personalInfo}
${summary}
${education}
${skills}
${projects}
${experience}

\\end{document}
`;
}

function escapeLatex(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function stripLatexTags(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\textbf\{([^}]+)\}/g, "$1")
    .replace(/\\textit\{([^}]+)\}/g, "$1")
    .replace(/\\href\{[^}]+\}\{([^}]+)\}/g, "$1")
    .replace(/\\underline\{([^}]+)\}/g, "$1")
    .replace(/\\Large\s*/g, "")
    .replace(/\\large\s*/g, "")
    .replace(/\\small\s*/g, "")
    .replace(/\\Huge\s*/g, "")
    .replace(/\\uppercase\{([^}]+)\}/g, "$1")
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\#/g, "#")
    .replace(/\\_/g, "_")
    .replace(/\\\$/g, "$")
    .replace(/\\\{/g, "{")
    .replace(/\\\}/g, "}")
    .replace(/\\;/g, "")
    .replace(/\\\|/g, "|")
    .replace(/\\\\/g, " ")
    .trim();
}

export function parseLatexToJSON(latex: string, baseContent: ResumeContent): ResumeContent {
  const content = JSON.parse(JSON.stringify(baseContent)) as ResumeContent;

  try {
    // 1. Parse Name
    const nameMatch = latex.match(/\\Large\s*\\textbf\{([^}]+)\}/);
    if (nameMatch && nameMatch[1]) content.personalInfo.fullName = stripLatexTags(nameMatch[1]);

    // 2. Parse Phone
    const phoneMatch = latex.match(/\+?\d{1,3}[\s-]?\d{3,5}[\s-]?\d{4,5}/);
    if (phoneMatch && phoneMatch[0]) content.personalInfo.phone = stripLatexTags(phoneMatch[0]);

    // 3. Parse Email
    const emailMatch = latex.match(/\\href\{mailto:([^}]+)\}/);
    if (emailMatch && emailMatch[1]) content.personalInfo.email = stripLatexTags(emailMatch[1]);

    // 4. Parse Summary
    const summaryMatch = latex.match(/\\section\*\{Summary\}([\s\S]*?)(?=\\section|\s*\\end\{document\})/);
    if (summaryMatch && summaryMatch[1]) content.personalInfo.summary = stripLatexTags(summaryMatch[1]);

    // 5. Parse Education
    const eduMatch = latex.match(/\\section\*\{Education\}([\s\S]*?)(?=\\section|\s*\\end\{document\})/);
    if (eduMatch && eduMatch[1]) {
      const edBlocks = eduMatch[1].split(/\\noindent/).filter(b => b.trim());
      content.education = edBlocks.map((block, i) => {
        const lines = block.split('\\\\').map(l => l.trim());
        let school = "School Name", startDate = "", endDate = "", degree = "", field = "", gpa = "";
        
        if (lines[0]) {
          const m1 = lines[0].match(/\\textbf\{([^}]+)\}\s*\\hfill\s*(.*?)--\s*(.*)/);
          if (m1) { school = m1[1]; startDate = m1[2].trim(); endDate = m1[3].trim(); }
          else {
            const mFallback = lines[0].match(/\\textbf\{([^}]+)\}/);
            if (mFallback) school = mFallback[1];
          }
        }
        if (lines[1]) {
          const m2 = lines[1].match(/([^in]+)in([^\\]+)\\hfill\s*GPA:\s*(.*)/);
          if (m2) { degree = m2[1].trim(); field = m2[2].trim(); gpa = m2[3].trim(); }
          else {
            const spl = lines[1].split('in');
            if (spl.length > 1) {
              degree = spl[0].trim();
              field = spl[1].split('\\hfill')[0].trim();
            }
          }
        }
        return { 
          id: `edu-${i}`, 
          school: stripLatexTags(school), 
          startDate: stripLatexTags(startDate), 
          endDate: stripLatexTags(endDate), 
          degree: stripLatexTags(degree), 
          field: stripLatexTags(field), 
          gpa: stripLatexTags(gpa) 
        };
      });
    }

    // 6. Parse Skills
    const skillsMatch = latex.match(/\\section\*\{Technical Skills\}([\s\S]*?)(?=\\section|\s*\\end\{document\})/);
    if (skillsMatch && skillsMatch[1]) {
      const skillLines = skillsMatch[1].split('\\\\').map(l => l.trim()).filter(l => l);
      content.skills = skillLines.map((line, i) => {
        const m = line.match(/\\textbf\{([^}]+)\}:\s*(.*)/);
        if (m) return { id: `skill-${i}`, category: stripLatexTags(m[1]), items: stripLatexTags(m[2]) };
        return { id: `skill-${i}`, category: "Skill", items: stripLatexTags(line) };
      });
    }

    // 7. Parse Projects
    const projMatch = latex.match(/\\section\*\{Projects\}([\s\S]*?)(?=\\section|\s*\\end\{document\})/);
    if (projMatch && projMatch[1]) {
      const projBlocks = projMatch[1].split(/\\noindent/).filter(b => b.trim());
      content.projects = projBlocks.map((block, i) => {
        let name = "Project Name", techStack = "Tech Stack", description = "";
        const lines = block.split('\\\\');
        if (lines[0]) {
          const m1 = lines[0].match(/\\textbf\{([^}]+)\}\s*\\hfill\s*\\textit\{([^}]+)\}/);
          if (m1) { name = m1[1].trim(); techStack = m1[2].trim(); }
        }
        const descMatch = block.match(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/);
        if (descMatch && descMatch[1]) {
          description = descMatch[1].split('\\item').slice(1).map(i => `- ${stripLatexTags(i.trim())}`).join('\n');
        }
        return { 
          id: `proj-${i}`, 
          name: stripLatexTags(name), 
          techStack: stripLatexTags(techStack), 
          description, 
          link: "" 
        };
      });
    }

    // 8. Parse Experience
    const expMatch = latex.match(/\\section\*\{Experience\}([\s\S]*?)(?=\\section|\s*\\end\{document\})/);
    if (expMatch && expMatch[1]) {
      const expBlocks = expMatch[1].split(/\\noindent/).filter(b => b.trim());
      content.experience = expBlocks.map((block, i) => {
        let company = "Company Name", startDate = "", endDate = "", role = "Role", description = "";
        const lines = block.split('\\\\');
        if (lines[0]) {
          const m1 = lines[0].match(/\\textbf\{([^}]+)\}\s*\\hfill\s*(.*?)--\s*(.*)/);
          if (m1) { company = m1[1].trim(); startDate = m1[2].trim(); endDate = m1[3].trim(); }
        }
        if (lines[1]) {
          const m2 = lines[1].match(/\\textit\{([^}]+)\}/);
          if (m2) role = m2[1].trim();
        }
        const descMatch = block.match(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/);
        if (descMatch && descMatch[1]) {
          description = descMatch[1].split('\\item').slice(1).map(item => `- ${stripLatexTags(item.trim())}`).join('\n');
        }
        return { 
          id: `exp-${i}`, 
          company: stripLatexTags(company), 
          role: stripLatexTags(role), 
          startDate: stripLatexTags(startDate), 
          endDate: stripLatexTags(endDate), 
          description, 
          location: "", 
          current: endDate.toLowerCase().includes('present') 
        };
      });
    }

  } catch (e) {
    console.error("Error parsing LaTeX", e);
  }

  return content;
}
