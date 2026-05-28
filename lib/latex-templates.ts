import { ResumeContent } from "./mock-data";

import { ResumeContent } from "./mock-data";

export function generateDefaultLatex(content: ResumeContent, templateId: string = "velora-professional"): string {
  if (templateId === "dev-terminal") {
    return `%------------------------
% Resume Template
% Author : Anubhav Singh
% Github : https://github.com/xprilion
% License : MIT
%------------------------

\\documentclass[a4paper,20pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[pdftex]{hyperref}
\\usepackage{fancyhdr}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.530in}
\\addtolength{\\evensidemargin}{-0.375in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.45in}
\\addtolength{\\textheight}{1in}

\\urlstyle{rm}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-10pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-6pt}]

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[2]{
  \\item\\small{
    \\textbf{#1}{: #2 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeItemWithoutTitle}[1]{
  \\item\\small{
    {\\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{#3} & \\textit{#4} \\\\
    \\end{tabular*}\\vspace{-5pt}
}


\\newcommand{\\resumeSubItem}[2]{\\resumeItem{#1}{#2}\\vspace{-3pt}}

\\renewcommand{\\labelitemii}{$\\circ$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=*]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-----------------------------
%%%%%%  CV STARTS HERE  %%%%%%

\\begin{document}

%----------HEADING-----------------
\\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
  \\textbf{{\\LARGE Arush Jain }} & Email: \\href{mailto:}{xprilion@gmail.com}\\\\
  \\href{https://xprilion.com}{Portfolio: xprilion.com} & Mobile:~~~+91-XXX-XXXX-XXX \\\\
  \\href{https://github.com/xprilion}{Github: ~~github.com/xprilion} \\\\
\\end{tabular*}

%-----------EDUCATION-----------------
\\section{~~Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Netaji Subhash Engineering College}{Kolkata, India}
      {Bachelor of Technology - Information Technology;  GPA: 7.27}{July 2016 - June 2020}
      {\\scriptsize \\textit{ \\footnotesize{\\newline{}\\textbf{Courses:} Operating Systems, Data Structures, Analysis Of Algorithms, Artificial Intelligence, Machine Learning, Networking, Databases}}}
    \\resumeSubHeadingListEnd
	    
\\vspace{-5pt}
\\section{Skills Summary}
	\\resumeSubHeadingListStart
	\\resumeSubItem{Languages}{~~~~~~Python, PHP, C++, JavaScript, SQL, Bash, JAVA}
	\\resumeSubItem{Frameworks}{~~~~Scikit, NLTK, SpaCy, TensorFlow, Keras, Django, Flask, NodeJS, LAMP}
	\\resumeSubItem{Tools}{~~~~~~~~~~~~~~Kubernetes, Docker, GIT, PostgreSQL, MySQL, SQLite}
	\\resumeSubItem{Platforms}{~~~~~~~Linux, Web, Windows, Arduino, Raspberry, AWS, GCP, Alibaba Cloud, IBM Cloud}
	\\resumeSubItem{Soft Skills}{~~~~~~~Leadership, Event Management, Writing, Public Speaking, Time Management}

\\resumeSubHeadingListEnd
\\vspace{-5pt}
\\section{Experience}
  \\resumeSubHeadingListStart
    \\resumeSubheading{Google Summer of Code - Submitty}{Remote}
    {Student Developer (Full-time)}{May 2019 - Sep 2019}
    \\resumeItemListStart
        \\resumeItem{Discussion Forum Upgrades}
          {Refactor forum for performance to handle large databases.}
          \\resumeItem{REST API for Discussion Forum}
          {Symphony \\& Twig based Forum parts converted to API-first interface.}
          \\resumeItem{Ratchet PHP WebSocket}{Implemented a WebSocket for low-latency real time exchange of posts and thread updates.}
      \\resumeItemListEnd
\\vspace{-5pt}
    \\resumeSubheading
		{DataCamp Inc.}{Remote}
		{Instructor (Part-time, Contractual)}{Dec 2018 -  Present}
		\\resumeItemListStart
        \\resumeItem{Project Course - Find Movie Similarity from Plot Summaries}
          {Created project based course using Unsupervised learning and natural language processing.}
        \\resumeItem{Tutorial - Introduction to Reinforcement Learning}
          {Created tutorial for Q-learning RL algorithm and  concepts.}
        \\resumeItem{Impact}{Course has been taken by 250+ students so far with 4.65 average rating.}
		\\resumeItemListEnd

\\resumeSubHeadingListEnd

%-----------PROJECTS-----------------
\\vspace{-5pt}
\\section{Projects}
\\resumeSubHeadingListStart
\\resumeSubItem{Vison - multimedia search engine (NLP, Search Engine, Web Crawlers, Multimedia Processing)}{(Work in progress) Research oriented, open source, search engine for bringing reverse multimedia search to small \\& mid scale enterprises. Tech: Python, NodeJS, Intel OpenVino Toolkit, Selenium, TensorFlow (October '18)}
\\vspace{2pt}
\\resumeSubItem{Reinforcement Learning based Traffic Control System (Reinforcement Learning, Computer Vision)}{AI model to resolve city traffic around 50\\%
faster. Tech: Python, Alibaba Cloud, Raspberry Pi, Arduino, SUMO \\& OpenCV. (August '18)}
\\vspace{2pt}
\\resumeSubItem{Panorama from Satellite Imagery using Distributed Computing (Distributed Computing, Image Processing)}{Images clicked using drones, provided by ISRO were stitched together using distributed public compute nodes, effectively bringing down processing time exponentially. Tech: PHP, C++, Java, Python (March '18)}
\\vspace{2pt}
\\resumeSubItem{Drag-n-drop machine learning learning environment (Web Development, Machine Learning)}{Scratch like tool for implementing machine learning pipelines along with built in tutorial for each concept. Tech: Python, JavaScript (September '18)}
\\vspace{2pt}
\\resumeSubItem{Search Engine and Social Network(Web Development, Web Crawler, Search)}{Created from scratch a social network and a search engine based on the idea of integrating Facebook and Google. The launched website was among top 1000 websites in India during 2012-2013. Tech: PHP, MySQL, HTML, CSS, WebSockets, JavaScript, RSS, XML ( May '12)}
\\resumeSubHeadingListEnd
\\vspace{-5pt}
\\section{Publications}
\\resumeSubHeadingListStart
\\resumeSubItem{Book: Deep Learning on Web (Web Development, Deep Learning)}{Work in Progress book to be published by Packt Publishing in late 2019. Tech: Django, Python, AWS, GCP, Azure (November '18)}
\\vspace{2pt}
\\resumeSubItem{Book: Deep Learning on Mobile Devices (Flutter App Development, Deep Learning)}{Work in Progress book to be published by Packt Publishing in late 2019. Tech: Flutter, Android, Firebase, TensorFlow, Python, Dart (December '18)}
\\resumeSubHeadingListEnd
\\vspace{-5pt}
%-----------Awards-----------------
\\section{Honors and Awards}
\\begin{description}[font=$\\bullet$]
\\item {Awarded title of Intel Software Innovator - May, 2019}
\\vspace{-5pt}
\\item {Second Runner's Up at TCS EngiNx Engineering Project Innovation Content - September, 2018 }
\\vspace{-5pt}
\\item {Runner's Up at Facebook Developers Circle Hackathon - August, 2017}

\\end{description}

\\vspace{-5pt}
\\section{Volunteer Experience}
  \\resumeSubHeadingListStart
	\\resumeSubheading
    {Community Lead at Developer Student Clubs NSEC}{Kolkata, India}
    {Conducted online and offline technical \\& soft-skills training impacting over 3000 students.}{Jan 2019 - Present}
\\vspace{5pt}
    % \\vspace{10pt}\\textbf{\\large{Community Experience}}
    \\resumeSubheading
    {Event Organizer at Google Developers Group Kolkata}{Kolkata, India}
    {Organized events, conducted workshops and delivered workshops reaching over 7000 developers.}{Jan 2018 - Present}

\\resumeSubHeadingListEnd

\\end{document}
`;
  }

  if (templateId === "modern-minimalist") {
    return `% a mashup of hipstercv, friggeri and twenty cv
% https://www.latextemplates.com/template/twenty-seconds-resumecv
% https://www.latextemplates.com/template/friggeri-resume-cv

\\documentclass[lighthipster]{simplehipstercv}
% available options are: darkhipster, lighthipster, pastel, allblack, grey, verylight, withoutsidebar
% withoutsidebar
\\usepackage[utf8]{inputenc}
\\usepackage[default]{raleway}
\\usepackage[margin=1cm, a4paper]{geometry}


%------------------------------------------------------------------ Variablen

\\newlength{\\rightcolwidth}
\\newlength{\\leftcolwidth}
\\setlength{\\leftcolwidth}{0.23\\textwidth}
\\setlength{\\rightcolwidth}{0.75\\textwidth}

%------------------------------------------------------------------
\\title{New Simple CV}
\\author{\\LaTeX{} Ninja}
\\date{June 2019}

\\pagestyle{empty}
\\begin{document}


\\thispagestyle{empty}
%-------------------------------------------------------------

\\section*{Start}

\\simpleheader{headercolour}{Jack}{Sparrow}{Captain}{white}



%------------------------------------------------

% this has to be here so the paracols starts..
\\subsection*{}
\\vspace{4em}

\\setlength{\\columnsep}{1.5cm}
\\columnratio{0.23}[0.75]
\\begin{paracol}{2}
\\hbadness5000
%\\backgroundcolor{c[1]}[rgb]{1,1,0.8} % cream yellow for column-1 %\\backgroundcolor{g}[rgb]{0.8,1,1} % \\backgroundcolor{l}[rgb]{0,0,0.7} % dark blue for left margin

\\paracolbackgroundoptions

% 0.9,0.9,0.9 -- 0.8,0.8,0.8


\\footnotesize
{\\setasidefontcolour
\\flushright
\\begin{center}
    \\roundpic{jack.jpg}
\\end{center}

\\bg{cvgreen}{white}{About me}\\\\[0.5em]

{\\footnotesize
\\lorem\\lorem\\lorem}
\\bigskip

\\bg{cvgreen}{white}{personal} \\\\[0.5em]
Jack Sparrow

nationality: English 

1690

\\bigskip

\\bg{cvgreen}{white}{Areas of specialization} \\\\[0.5em]

Privateering ~•~ Bucaneering ~•~ Parler ~•~ Rum

\\bigskip



\\bigskip

\\bg{cvgreen}{white}{Interests}\\\\[0.5em]

\\lorem
\\bigskip

\\bg{cvgreen}{white}{Interests}\\\\[0.5em]

\\texttt{R} ~/~ \\texttt{Android} ~/~ \\texttt{Linux}

\\texttt{R} ~/~ \\texttt{Android} ~/~ \\texttt{Linux}

\\texttt{R} ~/~ \\texttt{Android} ~/~ \\texttt{Linux}

\\vspace{4em}

\\infobubble{\\faAt}{cvgreen}{white}{jack@sparrow.org}
\\infobubble{\\faTwitter}{cvgreen}{white}{@sparrow}
\\infobubble{\\faFacebook}{cvgreen}{white}{Jack Sparrow}
\\infobubble{\\faGithub}{cvgreen}{white}{sparrow}

\\phantom{turn the page}

\\phantom{turn the page}
}
%-----------------------------------------------------------
\\switchcolumn

\\small
\\section*{Short Resumé}

\\begin{tabular}{r| p{0.5\\textwidth} c}
    \\cvevent{2018--2021}{Captain of the Black Pearl}{Lead}{East Indies \\color{cvred}}{Finally got the goddamn ship back.\\lorem\\lorem\\lorem}{disney.png} \\\\
    \\cvevent{2016--2017}{Captain of the Black Pearl}{Lead}{Tortuga \\color{cvred}}{Found a secret treasure, lost the ship. \\lorem\\lorem}{medal.jpeg}
\\end{tabular}
\\vspace{3em}

\\begin{minipage}[t]{0.35\\textwidth}
\\section*{Degrees}
\\begin{tabular}{r p{0.6\\textwidth} c}
    \\cvdegree{1710}{Captain}{Certified}{Tortuga Uni \\color{headerblue}}{}{disney.png} \\\\
    \\cvdegree{1715}{Bucaneering}{M.A.}{London \\color{headerblue}}{}{medal.jpeg} \\\\
    \\cvdegree{1720}{Bucaneering}{B.A.}{London \\color{headerblue}}{}{medal.jpeg}
\\end{tabular}
\\end{minipage}\\hfill
\\begin{minipage}[t]{0.3\\textwidth}
\\section*{Programming}
\\begin{tabular}{r @{\\hspace{0.5em}}l}
     \\bg{skilllabelcolour}{iconcolour}{html, css} &  \\barrule{0.4}{0.5em}{cvpurple}\\\\
     \\bg{skilllabelcolour}{iconcolour}{\\LaTeX} & \\barrule{0.55}{0.5em}{cvgreen} \\\\
     \\bg{skilllabelcolour}{iconcolour}{python} & \\barrule{0.5}{0.5em}{cvpurple} \\\\
     \\bg{skilllabelcolour}{iconcolour}{R} & \\barrule{0.25}{0.5em}{cvpurple} \\\\
     \\bg{skilllabelcolour}{iconcolour}{javascript} & \\barrule{0.1}{0.5em}{cvpurple} \\\\
\\end{tabular}
\\end{minipage}

\\section*{Curriculum}
\\begin{tabular}{r| p{0.5\\textwidth} c}
    \\cvevent{2018--2021}{Captain of the Black Pearl}{Lead}{East Indies \\color{cvred}}{Finally got the goddamn ship back. \\lorem}{disney.png} \\\\
    \\cvevent{2019}{Freelance Pirate}{Bucaneering}{Tortuga \\color{cvred}}{This and that. The usual, aye?  \\lorem}{medal.jpeg} \\\\
\\end{tabular}
\\vspace{3em}

\\begin{minipage}[t]{0.3\\textwidth}
\\section*{Certificates \\& Grants}
\\begin{tabular}{>{\\footnotesize\\bfseries}r >{\\footnotesize}p{0.55\\textwidth}}
    1708 & Captain's Certificates \\\\
    1710 & Travel grant \\\\
    1715--1716 & Grant from the Pirate's Company
\\end{tabular}
\\bigskip

\\section*{Languages}
\\begin{tabular}{l | ll}
\\textbf{English} & C2 & {\\phantom{x}\\footnotesize mother tongue} \\\\
\\textbf{French} & C2 & \\pictofraction{\\faCircle}{cvgreen}{3}{black!30}{1}{\\tiny} \\\\
\\textbf{Spanish} & C2 & \\pictofraction{\\faCircle}{cvgreen}{1}{black!30}{3}{\\tiny} \\\\
\\textbf{Italian} & C2 & \\pictofraction{\\faCircle}{cvgreen}{3}{black!30}{1}{\\tiny}
\\end{tabular}
\\bigskip

\\end{minipage}\\hfill
\\begin{minipage}[t]{0.3\\textwidth}
\\section*{Publications}
\\begin{tabular}{>{\\footnotesize\\bfseries}r >{\\footnotesize}p{0.7\\textwidth}}
    1729 & \\emph{How I almost got killed by Lady Swan}, Tortuga Printing Press. \\\\
    1720 & ``Privateering for Beginners'', in: \\emph{The Pragmatic Pirate} (1/1720).
\\end{tabular}
\\bigskip

\\section*{Talks}
\\begin{tabular}{>{\\footnotesize\\bfseries}r >{\\footnotesize}p{0.6\\textwidth}}
    Nov. 1726 & ``How I lost my ship (\\& and how to get it back)'', at: \\emph{Annual Pirate's Conference} in Tortuga, Nov. 1726.
\\end{tabular}
\\end{minipage}






\\vfill{} % Whitespace before final footer

%----------------------------------------------------------------------------------------
%	FINAL FOOTER
%----------------------------------------------------------------------------------------
\\setlength{\\parindent}{0pt}
\\begin{minipage}[t]{\\rightcolwidth}
\\begin{center}\\fontfamily{\\sfdefault}\\selectfont \\color{black!70}
{\\small Jack Sparrow \\icon{\\faEnvelopeO}{cvgreen}{} The Black Pearl \\icon{\\faMapMarker}{cvgreen}{} Tortuga \\icon{\\faPhone}{cvgreen}{} 0099/333 5647380 \\newline\\icon{\\faAt}{cvgreen}{} \\protect\\url{jack@sparrow.com}
}
\\end{center}
\\end{minipage}

\\end{paracol}

\\end{document}
`;
  }

  if (templateId === "creative-accent") {
    return `%%%%%%%%%%%%%%%
% This CV example/template is based on my own
% CV which I (lamely attempted) to clean up, so that
% it's less of an eyesore and easier for others to use.
%
% LianTze Lim (liantze@gmail.com)
% 23 Oct, 2022
% 24 Aug, 2024 -- Updated X (Twitter) icon
\\documentclass[a4paper,skipsamekey,11pt,english]{curve}

% Uncomment to enable Chinese; needs XeLaTeX
% \\usepackage{ctex}


% Default biblatex style used for the publication list is APA6. If you wish to use a different style or pass other options to biblatex you can change them here. 
\\PassOptionsToPackage{style=ieee,sorting=ydnt,uniquename=init,defernumbers=true}{biblatex}

% Most commands and style definitions are in settings.sty.
\\usepackage{settings}

% If you need to further customise your biblatex setup e.g. with \\DeclareFieldFormat etc please add them here AFTER loading settings.sty. For example, to remove the default "[Online] Available:" prefix before URLs when using the IEEE style:
\\DefineBibliographyStrings{english}{url={\\textsc{url}}}

%% Only needed if you want a Publication List
\\addbibresource{own-bib.bib}

%% Specify your last name(s) and first name(s) (as given in the .bib) to automatically bold your own name in the publications list. 
%% One caveat: You need to write \\bibnamedelima where there's a space in your name for this to work properly; or write \\bibnamedelimi if you use initials in the .bib
% \\mynames{Lim/Lian\\bibnamedelima Tze}

%% You can specify multiple names like this, especially if you have changed your name or if you need to highlight multiple authors. See items 6–9 in the example "Journal Articles" output.
\\mynames{Lim/Lian\\bibnamedelima Tze,
  Wong/Lian\\bibnamedelima Tze,
  Lim/Tracy,
  Lim/L.\\bibnamedelimi T.}
%% MAKE SURE THERE IS NO SPACE AFTER THE FINAL NAME IN YOUR \\mynames LIST

% Change the fonts if you want
\\ifxetexorluatex % If you're using XeLaTeX or LuaLaTeX
  \\usepackage{fontspec} 
  %% You can use \\setmainfont etc; I'm just using these font packages here because they provide OpenType fonts for use by XeLaTeX/LuaLaTeX anyway
  \\usepackage[p,osf,swashQ]{cochineal}
  \\usepackage[medium,bold]{cabin}
  \\usepackage[varqu,varl,scale=0.9]{zi4}
\\else % If you're using pdfLaTeX or latex
  \\usepackage[T1]{fontenc}
  \\usepackage[p,osf,swashQ]{cochineal}
  \\usepackage{cabin}
  \\usepackage[varqu,varl,scale=0.9]{zi4}
\\fi

% Change the page margins if you want
% \\geometry{left=1cm,right=1cm,top=1.5cm,bottom=1.5cm}

% Change the colours if you want
% \\definecolor{SwishLineColour}{HTML}{00FFFF}
% \\definecolor{MarkerColour}{HTML}{0000CC}

% Change the item prefix marker if you want
% \\prefixmarker{$\\diamond$}

%% Photo is only shown if "fullonly" is included
\\includecomment{fullonly}
% \\excludecomment{fullonly}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


\\leftheader{%
  {\\LARGE\\bfseries\\sffamily Your Name Here, Ph.D.}

  \\makefield{\\faEnvelope[regular]}{\\href{mailto:example@gmail.com}{\\texttt{example@gmail.com}}}
  % fontawesome5 doesn't have the X icon so we use
  % the simpleicons package here instead; but some 
  % font size adjustment might be needed
  \\makefield{{\\scriptsize\\simpleicon{x}}}{\\!\\href{https://x.com/overleaf_example}{\\texttt{@overleaf\\_example}}}
  \\makefield{\\faLinkedin}
  {\\href{http://www.linkedin.com/in/example/}{\\texttt{example}}}

  %% Next line
  \\makefield{\\faGlobe}{\\url{http://example.example.org/}}
  % You can use a tabular here if you want to line up the fields.
}

\\rightheader{~}
\\begin{fullonly}
\\photo[r]{photo}
\\photoscale{0.13}
\\end{fullonly}

\\title{Curriculum Vitae}

\\begin{document}
\\makeheaders[c]

\\makerubric{employment}
\\makerubric{education}

% If you're not a researcher nor an academic, you probably don't have any publications; delete this line.
%% Sometimes when a section can't be nicely modelled with the \\entry[]... mechanism; hack our own and use \\input NOT \\makerubric
\\input{publications}

\\makerubric{skills}
\\makerubric{misc}

\\makerubric{referee}
% \\input{referee-full}

\\end{document}
`;
  }

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
