import { useRef, useState, useEffect } from 'react';
import './App.css';
import JSZip from 'jszip';

// Dynamically load MathJax
const loadMathJax = () => {
  if (!window.MathJax) {
    // Configure MathJax before loading
    window.MathJax = {
      tex: { 
        inlineMath: [['\\(','\\)']], 
        displayMath: [['\\[','\\]']] 
      },
      svg: { 
        fontCache: 'global' 
      },
      startup: {
        ready: () => {
          console.log('MathJax is loaded and ready');
          window.MathJax.startup.defaultReady();
        }
      }
    };
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
    script.async = true;
    document.head.appendChild(script);
  }
};

// Dynamically load CodeMirror CSS/JS and search addon
const loadCodeMirror = () => {
  if (!window.CodeMirror) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css';
    document.head.appendChild(link);
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.js';
    script1.async = false;
    document.body.appendChild(script1);
    const script2 = document.createElement('script');
    script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/mode/stex/stex.min.js';
    script2.async = false;
    document.body.appendChild(script2);
    // Add search addon
    const script3 = document.createElement('script');
    script3.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/search/searchcursor.min.js';
    script3.async = false;
    document.body.appendChild(script3);
    const script4 = document.createElement('script');
    script4.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/search/search.min.js';
    script4.async = false;
    document.body.appendChild(script4);
    const script5 = document.createElement('script');
    script5.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/dialog/dialog.min.js';
    script5.async = false;
    document.body.appendChild(script5);
    const link2 = document.createElement('link');
    link2.rel = 'stylesheet';
    link2.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/dialog/dialog.min.css';
    document.head.appendChild(link2);
  }
};

// --- Correct default LaTeX example (math and image) ---
const initialLatex = `% LaTeX Example: Features Showcase
% Updated: 9 June 2025

% Title and author
\\title{LaTeX Features Showcase}
\\author{Vladimir Kunitsky}
\\date{\\today}

\\begin{document}
\\maketitle
\\tableofcontents
\\newpage

\\section{Math}
Inline math: $a^2 + b^2 = c^2$.

Display math:
\\[
\\int_0^\\infty e^{-x^2} \, dx = \\frac{\\sqrt{\\pi}}{2}
\\]

\\section{Text with Image Layout}
\\begin{textimage}
This is some text content that will appear on the left side of the layout. You can write multiple paragraphs here, and they will be displayed alongside the image on the right.

The image will be automatically scaled to 0.8 width (80% of its container) and positioned to the right of this text content. This creates a nice side-by-side layout that's perfect for documentation, tutorials, or any content where you want to combine explanatory text with visual elements.

You can include any LaTeX formatting in this text section, such as \\textbf{bold text}, \\textit{italic text}, or even inline math like $E = mc^2$.

\\imageright
\\includegraphics{Scan.jpeg}
\\end{textimage}

\\section{Regular Images}
% Upload an image and use: \\includegraphics[width=0.5\\linewidth]{your_image.png}
\\includegraphics[width=0.5\\linewidth]{Scan.jpeg}

% --- Centered column of math formulas ---
\\section{Centered Math Column}
\\centering
$E=mc^2$ \\\\
$a^2 + b^2 = c^2$ \\\\
$\\int_0^1 x^2 dx = \\frac{1}{3}$ \\\\
$\\sum_{n=1}^\\infty \\frac{1}{n^2} = \\frac{\\pi^2}{6}$

\\end{document}`;

function App() {
  const editorRef = useRef(null);
  const codeMirrorRef = useRef(null);
  const [latex, setLatex] = useState(initialLatex);
  const [html, setHtml] = useState('');
  const [imageMap, setImageMap] = useState(new Map());
  const [fontSize, setFontSize] = useState(16); // Default font size in pixels
  const [docFontSize, setDocFontSize] = useState(16); // Document font size
  const [dividerX, setDividerX] = useState(0.5); // 0.5 means 50% split
  const dragging = useRef(false);

  // Font options
  const fontOptions = [
    { label: 'LaTeX Default', value: '"Latin Modern Roman", "Computer Modern", STIX, Times, serif' },
    { label: 'Caveat', value: 'Caveat, cursive' },
    { label: 'Comic Neue', value: 'Comic Neue, cursive' },
    { label: 'Indie Flower', value: 'Indie Flower, cursive' },
    { label: 'Quicksand', value: 'Quicksand, sans-serif' },
    { label: 'Baloo 2', value: 'Baloo 2, cursive' },
    { label: 'Nunito', value: 'Nunito, sans-serif' },
    { label: 'Inter', value: 'Inter, sans-serif' },
  ];
  const [docFont, setDocFont] = useState(fontOptions[0].value);
  const [textColor, setTextColor] = useState('#222');
  const [bgColor, setBgColor] = useState('#fffbe7');

  // Load external libraries on mount
  useEffect(() => {
    loadCodeMirror();
    loadMathJax();
    const interval = setInterval(() => {
      if (window.CodeMirror && !codeMirrorRef.current) {
        codeMirrorRef.current = window.CodeMirror.fromTextArea(editorRef.current, {
          mode: 'stex',
          lineNumbers: true,
          matchBrackets: true,
        });
        codeMirrorRef.current.setValue(latex);
        codeMirrorRef.current.on('change', (cm) => setLatex(cm.getValue()));
        // Bind Cmd+F / Ctrl+F to search dialog
        codeMirrorRef.current.addKeyMap({
          'Cmd-F': function(cm) { cm.execCommand('find'); },
          'Ctrl-F': function(cm) { cm.execCommand('find'); }
        });
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // MathJax typeset after html update
  useEffect(() => {
    if (window.MathJax && html) {
      window.MathJax.typesetPromise && window.MathJax.typesetPromise();
    }
  }, [html]);

  // --- LaTeX to HTML conversion logic (adapted from your script) ---
  function extractBody(tex) {
    const marker = '\\begin{document}';
    const i = tex.indexOf(marker);
    if (i !== -1) {
      const after = tex.slice(i + marker.length);
      const m = after.match(/([\s\S]*?)\\end\{document\}/);
      return m ? m[1] : after;
    }
    return tex;
  }
  function escapeHTML(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function convertTexToHtml(raw, imageMapArg = imageMap) {
    // Fix: replace \Vec{...} with \vec{...} in LaTeX source for MathJax compatibility
    raw = raw.replace(/\\Vec\{/g, '\\vec{');
    let title='', author='', date='';
    const tm = raw.match(/\\title\{([\s\S]*?)\}/);
    if (tm) { title=tm[1]; raw=raw.replace(/\\title\{[\s\S]*?\}/,''); }
    const am = raw.match(/\\author\{([\s\S]*?)\}/);
    if (am) { author=am[1]; raw=raw.replace(/\\author\{[\s\S]*?\}/,''); }
    const dm = raw.match(/\\date\{([\s\S]*?)\}/);
    if (dm) {
      date = dm[1]==='\\today'
        ? new Date().toLocaleDateString('ru-RU',{year:'numeric',month:'long',day:'numeric'})
        : dm[1];
      raw = raw.replace(/\\date\{[\s\S]*?\}/,'');
    }
    let body = extractBody(raw);

    // --- Font size mapping ---
    const fontSizeMap = {
      '\\tiny': '0.6em',
      '\\scriptsize': '0.7em',
      '\\footnotesize': '0.8em',
      '\\small': '0.9em',
      '\\normalsize': '1em',
      '\\large': '1.2em',
      '\\Large': '1.44em',
      '\LARGE': '1.728em',
      '\\huge': '2.074em',
      '\\Huge': '2.488em',
    };
    // Inline font size commands (scoped)
    Object.entries(fontSizeMap).forEach(([cmd, size]) => {
      // Scoped: \Large{...}
      body = body.replace(new RegExp(cmd + '\\{([\\s\\S]+?)\\}', 'g'), `<span style="font-size:${size}">$1</span>`);
    });
    // Unscoped: \Large text (affects until next command or EOL)
    Object.entries(fontSizeMap).forEach(([cmd, size]) => {
      body = body.replace(new RegExp(cmd + '\\s+([^\\n\\\\]+)', 'g'), `<span style="font-size:${size}">$1</span>`);
    });

    // --- Font family mapping ---
    const fontFamilyMap = {
      '\\textrm': 'serif',
      '\\textsf': 'sans-serif',
      '\\texttt': 'monospace',
      '\\textnormal': 'serif',
      '\\rmfamily': 'serif',
      '\\sffamily': 'sans-serif',
      '\\ttfamily': 'monospace',
    };
    Object.entries(fontFamilyMap).forEach(([cmd, family]) => {
      // Scoped: \textrm{...}
      body = body.replace(new RegExp(cmd + '\\{([\\s\\S]+?)\\}', 'g'), `<span style="font-family:${family}">$1</span>`);
    });

    // --- Inline formatting and other replacements (before block-level) ---
    body = body
      .replace(/\\textbf\{([\s\S]+?)\}/g,'<strong>$1</strong>')
      .replace(/\\textit\{([\s\S]+?)\}/g,'<em>$1</em>')
      .replace(/\\underline\{([\s\S]+?)\}/g,'<u>$1</u>')
      .replace(/\\texttt\{([\s\S]+?)\}/g,'<code>$1</code>')
      // --- Degree sign: \degree or \\degree => ° ---
      .replace(/\\degree/g, '&deg;')
      // --- vspace: \vspace{150pt} or cm or mm or in ---
      .replace(/\\vspace\{\s*([\d.]+)\s*(pt|cm|mm|in)\s*\}/g, (m, val, unit) => {
        // Convert LaTeX units to CSS
        const unitMap = { pt: 'pt', cm: 'cm', mm: 'mm', in: 'in' };
        const cssUnit = unitMap[unit] || 'pt';
        return `<div style="height:${val}${cssUnit};"></div>`;
      })
      .replace(/\\textcolor\{([^}]+)\}\{([\s\S]+?)\}/g,'<span style="color:$1">$2</span>')
      .replace(/\\colorbox\{([^}]+)\}\{([\s\S]+?)\}/g,'<span style="background-color:$1">$2</span>')
      .replace(/\\fcolorbox\{([^}]+)\}\{([^}]+)\}\{([\s\S]+?)\}/g,
               '<span style="border:1px solid $1; background-color:$2">$3</span>')
      .replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g,
        (_,c)=>'<section class="abstract">'+c.trim().split(/\n{2,}/).map(p=>'<p>'+p.trim()+'</p>').join('')+'</section>')
      .replace(/\\begin\{definition\}([\s\S]*?)\\end\{definition\}/g,
        (_,c)=>`<div class="definition"><strong>Definition.</strong> ${c.trim()}</div>`)
      .replace(/\\begin\{theorem\}(?:\[(.*?)\])?([\s\S]*?)\\end\{theorem\}/g,
        (_,name,c)=>`<div class="theorem"><strong>${name?`Theorem (${name}).`:'Theorem.'}</strong> ${c.trim()}</div>`)
      .replace(/\\section\*?\{([^}]+)\}/g,'<h1>$1</h1>')
      .replace(/\\subsection\*?\{([^}]+)\}/g,'<h2>$1</h2>')
      .replace(/\\subsubsection\*?\{([^}]+)\}/g,'<h3>$1</h3>')
      .replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
        (_,t)=>'<ul>'+t.split(/\\item/).slice(1).map(i=>'<li>'+i.trim().replace(/\n/g,' ')+'</li>').join('')+'</ul>')
      .replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
        (_,t)=>'<ol>'+t.split(/\\item/).slice(1).map(i=>'<li>'+i.trim().replace(/\n/g,' ')+'</li>').join('')+'</ol>')
      .replace(/\\begin\{description\}([\s\S]*?)\\end\{description\}/g,
        (_,t)=>{let dl='<dl>';t.replace(/\\item\[(.*?)\]([\s\S]*?)(?=\\item\[|$)/g,(_,k,d)=>dl+='<dt>'+k+'</dt><dd>'+d.trim()+'</dd>');return dl+'</dl>'})
      .replace(/\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g,
        (_,c)=>'<blockquote>'+c.trim().split(/\n{2,}/).map(p=>'<p>'+p.trim()+'</p>').join('')+'</blockquote>')
      .replace(/\\begin\{lstlisting\}(?:\[(.*?)\])?\s*([\s\S]*?)\\end\{lstlisting\}/g,
        (_,o,c)=>{let lang='',cap='';if(o){const mL=o.match(/language=([^,\]]+)/);if(mL)lang=mL[1].toLowerCase();const mC=o.match(/caption=\{([\s\S]*?)\}/);if(mC)cap=mC[1];}const cls= lang?` class="language-${lang}"` : ''; return `<figure class="listing">${cap?`<figcaption>${cap}</figcaption>`:''}<pre><code${cls}>${escapeHTML(c.trim())}</code></pre></figure>`})
      .replace(/\\begin\{proof\}([\s\S]*?)\\end\{proof\}/g,
        (_,c)=>'<div class="proof"><strong>Proof.</strong> '+c.trim().replace(/\n/g,' ')+'</div>')
      .replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g,
        (_,c)=>'<pre><code>'+escapeHTML(c)+'</code></pre>')
      .replace(/\\begin\{thebibliography\}.*?\}([\s\S]*?)\\end\{thebibliography\}/g,
        (_,t)=>{let h='<section class="bibliography"><h2>References</h2><ul>';t.replace(/\\bibitem(?:\[[^\]]*\])?\{[^}]*\}([\s\S]*?)(?=\\bibitem|$)/g,(_,e)=>h+='<li>'+e.trim().replace(/\n/g,' ')+'</li>');return h+'</ul></section>'})
      .replace(/\\begin\{tabularx\}\{[^}]*\}\{[^}]+\}([\s\S]*?)\\end\{tabularx\}/g,
        (_,tbl)=>{const rows=tbl.replace(/\\hline/g,'').split(/\\\\/).map(r=>r.trim()).filter(r=>r);let t='<table>';rows.forEach(r=>t+='<tr>'+r.split('&').map(c=>'<td>'+c.trim()+'</td>').join('')+'</tr>');return t+'</table>'})
      .replace(/\\begin\{tabular\}\{[^}]+\}([\s\S]*?)\\end\{tabular\}/g,
        (_,tbl)=>{const rows=tbl.replace(/\\hline/g,'').split(/\\\\/).map(r=>r.trim()).filter(r=>r);let t='<table>';rows.forEach(r=>t+='<tr>'+r.split('&').map(c=>'<td>'+c.trim()+'</td>').join('')+'</tr>');return t+'</table>'})
      .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g,'<div class="math display">\\[$1\\]</div>')
      .replace(/\$([^$\n]+)\$/g,'<span class="math inline">\\($1\\)</span>');

    // --- Add \href support (after inline formatting, before block-level) ---
    body = body.replace(/\\href\{([^}]+)\}\{([\s\S]+?)\}/g, (m, url, inner) => {
      // If the inner is a <span style="color:...">, preserve it
      if (/^<span style="color:[^>]+>/.test(inner)) {
        return `<a href="${url}" target="_blank" style="text-decoration:underline;">${inner}</a>`;
      } else {
        return `<a href="${url}" target="_blank">${inner}</a>`;
      }
    });

    // --- Support for \begin{center} ... \end{center} (after inline, before paragraph split) ---
    body = body.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (m, content) => {
      return `<div class="center">${convertTexToHtml(content.trim())}</div>`;
    });

    // --- Handle centering EARLY, before other conversions ---
    // Mark centering sections with a special placeholder
    body = body.replace(/\\centering\s+([\s\S]*?)(?=\\section|\\subsection|\\subsubsection|\\end\{document\}|$)/g, 
      (match, content) => {
        // Remove any trailing whitespace/newlines and mark for centering
        return `__CENTER_START__${content.trim()}__CENTER_END__`;
      });

    // --- Horizontal rule support ---
    body = body.replace(/\\hrule|\\sectionbreak/g, '<hr />');

    // --- Side-by-side image and text ---
    body = body.replace(/\\begin\{sidebyside\}([\s\S]*?)\\sidebytext([\s\S]*?)\\end\{sidebyside\}/g,
      (_, left, right) => {
        // Try to render left as image(s), right as text
        return `<div class="sidebyside"><div class="sidebyside-left">${convertTexToHtml(left.trim())}</div><div class="sidebyside-right">${convertTexToHtml(right.trim())}</div></div>`;
      });

    // --- Text with image on right (scaled to 0.8) ---
    body = body.replace(/\\begin\{textimage\}([\s\S]*?)\\imageright([\s\S]*?)\\end\{textimage\}/g,
      (_, textContent, imageContent) => {
        // Process the text content but keep it as raw text without paragraph wrapping
        const processedText = textContent.trim()
          .replace(/\\textbf\{([\s\S]+?)\}/g,'<strong>$1</strong>')
          .replace(/\\textit\{([\s\S]+?)\}/g,'<em>$1</em>')
          .replace(/\\underline\{([\s\S]+?)\}/g,'<u>$1</u>')
          .replace(/\\texttt\{([\s\S]+?)\}/g,'<code>$1</code>')
          .replace(/\$([^$\n]+)\$/g,'<span class="math inline">\\($1\\)</span>')
          .split(/\n\s*\n/)
          .map(para => para.trim())
          .filter(para => para)
          .map(para => `<p>${para.replace(/\n/g, ' ')}</p>`)
          .join('');
        
        // Process the image content and add 0.8 scaling
        const processedImage = imageContent.replace(/\\includegraphics(?:\s*\[([^\]]*)\])?\s*\{\s*([^}]+?)\s*\}/g,
          (match, opts, path) => {
            // Override width to 0.8 linewidth for this layout
            const cleanPath = path.trim();
            const src = imageMap && imageMap.has(cleanPath) ? imageMap.get(cleanPath) : cleanPath;
            return `<img src="${src}" alt="" style="width:80%; max-width:400px;">`;
          }
        );
        return `<div class="textimage"><div class="textimage-left">${processedText}</div><div class="textimage-right">${processedImage.trim()}</div></div>`;
      });

    // --- Standalone \includegraphics handler (outside of figures) ---
    body = body.replace(/\\includegraphics(?:\s*\[([^\]]*)\])?\s*\{([\s\S]*?)\n?\s*\}/g,
      (match, opts, path) => {
        let style = '';
        if (opts) {
          const wMatch = opts.match(/width=([\d.]+)\\linewidth/);
          if (wMatch) style += `width:${parseFloat(wMatch[1])*100}%`; 
          const sMatch = opts.match(/scale=([\d.]+)/);
          if (sMatch) style += (style ? ';' : '') + `transform:scale(${parseFloat(sMatch[1])});transform-origin:left top;display:inline-block;`;
        }
        style = style ? ` style=\"${style}\"` : '';
        const cleanPath = path.replace(/\s+/g, '').trim();
        // Try to find the image by name, or by name without extension if not found
        let src = imageMapArg && imageMapArg.has(cleanPath) ? imageMapArg.get(cleanPath) : null;
        if (!src) {
          // Try to match ignoring extension
          const base = cleanPath.replace(/\.[a-zA-Z0-9]+$/, '');
          for (const [key, value] of imageMapArg.entries()) {
            if (key.replace(/\.[a-zA-Z0-9]+$/, '') === base) {
              src = value;
              break;
            }
          }
        }
        src = src || cleanPath;
        return `<img src=\"${src}\" alt=\"\"${style}>`;
      }
    );
    // --- More robust \includegraphics: tolerate newlines and spaces before closing brace ---
    body = body.replace(/\\includegraphics(?:\s*\[([^\]]*)\])?\s*\{([\s\S]*?)\n?\s*\}/g,
      (match, opts, path) => {
        const wMatch = opts && opts.match(/width=([\d.]+)\\linewidth/);
        const style = wMatch ? ` style="width:${parseFloat(wMatch[1])*100}%"` : '';
        const cleanPath = path.replace(/\s+/g, '').trim();
        // Try to find the image by name, or by name without extension if not found
        let src = imageMapArg && imageMapArg.has(cleanPath) ? imageMapArg.get(cleanPath) : null;
        if (!src) {
          const base = cleanPath.replace(/\.[a-zA-Z0-9]+$/, '');
          for (const [key, value] of imageMapArg.entries()) {
            if (key.replace(/\.[a-zA-Z0-9]+$/, '') === base) {
              src = value;
              break;
            }
          }
        }
        src = src || cleanPath;
        return `<img src="${src}" alt=""${style}>`;
      }
    );

    // --- Paragraph separation ---
    // Replace \par or double newlines with paragraph breaks
    body = body.replace(/\\par/g, '\n\n');

    // --- Handle line breaks ---
    // Convert LaTeX line breaks to HTML line breaks (but not in tables)
    body = body.replace(/\\\\(?!\s*&)/g, '<br>');
    body = body.replace(/\\newline/g, '<br>');
    body = body.replace(/\\linebreak/g, '<br>');

    // --- Fix table rules ---
    body = body.replace(/\\toprule|\\midrule|\\bottomrule/g, '');

    // --- Fix bibliography: \emph and \url ---
    body = body.replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>');
    body = body.replace(/\\url\{([^}]+)\}/g, '<a href="$1" target="_blank">$1</a>');

    // --- Fix table header row (first row in tabular) ---
    body = body.replace(/\\begin\{tabular\}\{[^}]+\}([\s\S]*?)\\end\{tabular\}/g,
      (_, tbl) => {
        const rows = tbl.split(/\\\\/).map(r => r.trim()).filter(r => r);
        let t = '<table>';
        if (rows.length > 0) {
          const header = rows[0].split('&').map(c => '<th>' + c.trim() + '</th>').join('');
          t += '<tr>' + header + '</tr>';
          rows.slice(1).forEach(r => {
            t += '<tr>' + r.split('&').map(c => '<td>' + c.trim() + '</td>').join('') + '</tr>';
          });
        }
        t += '</table>';
        return t;
      });

    // --- Improved tabularx with caption and scroll ---
    body = body.replace(/\\caption\{([^}]+)\}\s*\\begin\{tabularx\}([^]*?)\\end\{tabularx\}/g,
      (match, caption, tableContent) => {
        // Extract column format and rows
        const colMatch = tableContent.match(/^\{([^}]+)\}([\s\S]*)/);
        let colFormat = '', rows = tableContent;
        if (colMatch) {
          colFormat = colMatch[1];
          rows = colMatch[2];
        }
        // Split rows by \\ and keep \hline as markers
        const rowArr = rows.split(/\\\\/).map(r => r.trim()).filter(r => r.length > 0);
        let t = `<div class="table-scroll"><table><caption>${caption}</caption>`;
        let headerDone = false;
        rowArr.forEach((r, i) => {
          if (/^\\hline/.test(r) || r === '\\hline' || r === 'hline') return;
          if (!headerDone && (rowArr[i+1] && /hline/.test(rowArr[i+1]))) {
            // This is the header row
            t += '<tr>' + r.split('&').map(c => `<th>${c.trim()}</th>`).join('') + '</tr>';
            headerDone = true;
          } else {
            t += '<tr>' + r.split('&').map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
          }
        });
        t += '</table></div>';
        return t;
      });

    // --- Improved tabularx without caption ---
    body = body.replace(/\\begin\{tabularx\}([^]*?)\\end\{tabularx\}/g,
      (match, tableContent) => {
        const colMatch = tableContent.match(/^\{([^}]+)\}([\s\S]*)/);
        let colFormat = '', rows = tableContent;
        if (colMatch) {
          colFormat = colMatch[1];
          rows = colMatch[2];
        }
        const rowArr = rows.split(/\\\\/).map(r => r.trim()).filter(r => r.length > 0);
        let t = `<div class="table-scroll"><table>`;
        let headerDone = false;
        rowArr.forEach((r, i) => {
          if (/^\\hline/.test(r) || r === '\\hline' || r === 'hline') return;
          if (!headerDone && (rowArr[i+1] && /hline/.test(rowArr[i+1]))) {
            t += '<tr>' + r.split('&').map(c => `<th>${c.trim()}</th>`).join('') + '</tr>';
            headerDone = true;
          } else {
            t += '<tr>' + r.split('&').map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
          }
        });
        t += '</table></div>';
        return t;
      });

    // --- Improved centering logic ---
    // Replace \centering followed by block (image, table, figure, tabular, tabularx, includegraphics, etc.)
    body = body.replace(/\\centering\s*((?:<img [^>]+>|<table[\s\S]*?<\/table>|<figure[\s\S]*?<\/figure>|<div class="table-scroll">[\s\S]*?<\/div>|<pre[\s\S]*?<\/pre>|<blockquote[\s\S]*?<\/blockquote>|<ul[\s\S]*?<\/ul>|<ol[\sS]*?<\/ol>|<dl[\s\S]*?<\/dl>|<section[\sS]*?<\/section>|<h[1-6][^>]*>.*?<\/h[1-6]>|<p[\s\S]*?<\/p>))/,
      (_, block) => `<div class="center">${block}</div>`
    );
    // Remove any remaining standalone \centering
    body = body.replace(/\\centering\s*/g, '');

    body = body.replace(/\\maketitle/, `\n<header class="title">\n  <h1>${title}</h1>\n  <p class="author">${author}</p>\n  <p class="date">${date}</p>\n</header>\n`);
    body = body.replace(/\\tableofcontents/, '<nav class="toc"></nav>');
    body = body.replace(/\\newpage/g, '<div class="page-break"></div>');
    // --- Figure handling ---
    body = body.replace(
      /\\begin\{figure(?:\[[^\]]*\])?\}([\s\S]*?)\\end\{figure\}/g,
      (_, content) => {
        const inner = content.replace(/\\centering\s*/g, '');
        const imgs = [...inner.matchAll(
          /\\includegraphics(?:\[([^\]]*)\])?\{([\s\S]*?)\n?\s*\}/g
        )].map(m => {
          const opts = m[1]||'', path = m[2];
          let style = '';
          if (opts) {
            const wMatch = opts.match(/width=([\d.]+)\\linewidth/);
            if (wMatch) style += `width:${parseFloat(wMatch[1])*100}%`;
            const sMatch = opts.match(/scale=([\d.]+)/);
            if (sMatch) style += (style ? ';' : '') + `transform:scale(${parseFloat(sMatch[1])});transform-origin:left top;display:inline-block;`;
          }
          style = style ? ` style=\"${style}\"` : '';
          const cleanPath = path.replace(/\s+/g, '').trim();
          // Try to find the image by name, or by name without extension if not found
          let src = imageMap && imageMap.has(cleanPath) ? imageMap.get(cleanPath) : null;
          if (!src) {
            const base = cleanPath.replace(/\.[a-zA-Z0-9]+$/, '');
            for (const [key, value] of imageMap.entries()) {
              if (key.replace(/\.[a-zA-Z0-9]+$/, '') === base) {
                src = value;
                break;
              }
            }
          }
          src = src || cleanPath;
          return `<img src=\"${src}\" alt=\"\"${style}>`;
        });
        const capMatch = inner.match(/\\caption\{([\s\S]*?)\}/);
        const caption = capMatch
          ? `<figcaption>${capMatch[1]}</figcaption>`
          : '';
        return `<figure style=\"display:flex;flex-wrap:wrap;gap:1em;justify-content:center\">\n  ${imgs.join('')}\n  ${caption}\n</figure>`;
      }
    );
    // Table + caption + centering
    body = body.replace(
      /\\begin\{table.*?\}([\s\S]*?)\\end\{table\}/g,
      (_, tbl) => {
        const centered = /\\centering/.test(tbl);
        let inner = tbl.replace(/\\centering\s*/g, '');
        inner = inner.replace(/\\caption\{([\s\S]*?)\}/g, '<caption>$1</caption>');
        return centered
          ? `<div style="text-align:center">\n${inner}\n</div>`
          : inner;
      }
    );
    body = body
      .replace(/\\&/g,'&').replace(/\\%/g,'%').replace(/\\_/g,'_')
      .replace(/\\#/g,'#').replace(/\\\{/g,'{').replace(/\\\}/g,'}')
      .replace(/\\label\{[^}]+\}/g, '')
      .replace(/\\textbf\{([\s\S]+?)\}/g,'<strong>$1</strong>')
      .replace(/\\textit\{([\s\S]+?)\}/g,'<em>$1</em>')
      .replace(/\\underline\{([\s\S]+?)\}/g,'<u>$1</u>')
      .replace(/\\texttt\{([\s\S]+?)\}/g,'<code>$1</code>')
      .replace(/\\textsc\{([^}]+)\}/g,'<span style="font-variant:small-caps">$1</span>')
      .replace(/\\textcolor\{([^}]+)\}\{([\s\S]+?)\}/g,'<span style="color:$1">$2</span>')
      .replace(/\\colorbox\{([^}]+)\}\{([\s\S]+?)\}/g,'<span style="background-color:$1">$2</span>')
      .replace(/\\fcolorbox\{([^}]+)\}\{([^}]+)\}\{([\s\S]+?)\}/g,
               '<span style="border:1px solid $1; background-color:$2">$3</span>')
      .replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g,
        (_,c)=>'<section class="abstract">'+c.trim().split(/\n{2,}/).map(p=>'<p>'+p.trim()+'</p>').join('')+'</section>')
      .replace(/\\begin\{definition\}([\s\S]*?)\\end\{definition\}/g,
        (_,c)=>`<div class="definition"><strong>Definition.</strong> ${c.trim()}</div>`)
      .replace(/\\begin\{theorem\}(?:\[(.*?)\])?([\s\S]*?)\\end\{theorem\}/g,
        (_,name,c)=>`<div class="theorem"><strong>${name?`Theorem (${name}).`:'Theorem.'}</strong> ${c.trim()}</div>`)
      .replace(/\\section\*?\{([^}]+)\}/g,'<h1>$1</h1>')
      .replace(/\\subsection\*?\{([^}]+)\}/g,'<h2>$1</h2>')
      .replace(/\\subsubsection\*?\{([^}]+)\}/g,'<h3>$1</h3>')
      .replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
        (_,t)=>'<ul>'+t.split(/\\item/).slice(1).map(i=>'<li>'+i.trim().replace(/\n/g,' ')+'</li>').join('')+'</ul>')
      .replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
        (_,t)=>'<ol>'+t.split(/\\item/).slice(1).map(i=>'<li>'+i.trim().replace(/\n/g,' ')+'</li>').join('')+'</ol>')
      .replace(/\\begin\{description\}([\s\S]*?)\\end\{description\}/g,
        (_,t)=>{let dl='<dl>';t.replace(/\\item\[(.*?)\]([\s\S]*?)(?=\\item\[|$)/g,(_,k,d)=>dl+='<dt>'+k+'</dt><dd>'+d.trim()+'</dd>');return dl+'</dl>'})
      .replace(/\\begin\{quote\}([\s\S]*?)\\end\{quote\}/g,
        (_,c)=>'<blockquote>'+c.trim().split(/\n{2,}/).map(p=>'<p>'+p.trim()+'</p>').join('')+'</blockquote>')
      .replace(/\\begin\{lstlisting\}(?:\[(.*?)\])?\s*([\s\S]*?)\\end\{lstlisting\}/g,
        (_,o,c)=>{let lang='',cap='';if(o){const mL=o.match(/language=([^,\]]+)/);if(mL)lang=mL[1].toLowerCase();const mC=o.match(/caption=\{([\s\S]*?)\}/);if(mC)cap=mC[1];}const cls= lang?` class="language-${lang}"` : ''; return `<figure class="listing">${cap?`<figcaption>${cap}</figcaption>`:''}<pre><code${cls}>${escapeHTML(c.trim())}</code></pre></figure>`})
      .replace(/\\begin\{proof\}([\s\S]*?)\\end\{proof\}/g,
        (_,c)=>'<div class="proof"><strong>Proof.</strong> '+c.trim().replace(/\n/g,' ')+'</div>')
      .replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g,
        (_,c)=>'<pre><code>'+escapeHTML(c)+'</code></pre>')
      .replace(/\\begin\{thebibliography\}.*?\}([\s\S]*?)\\end\{thebibliography\}/g,
        (_,t)=>{let h='<section class="bibliography"><h2>References</h2><ul>';t.replace(/\\bibitem(?:\[[^\]]*\])?\{[^}]*\}([\s\S]*?)(?=\\bibitem|$)/g,(_,e)=>h+='<li>'+e.trim().replace(/\n/g,' ')+'</li>');return h+'</ul></section>'})
      .replace(/\\begin\{tabularx\}\{[^}]*\}\{[^}]+\}([\s\S]*?)\\end\{tabularx\}/g,
        (_,tbl)=>{const rows=tbl.replace(/\\hline/g,'').split(/\\\\/).map(r=>r.trim()).filter(r=>r);let t='<table>';rows.forEach(r=>t+='<tr>'+r.split('&').map(c=>'<td>'+c.trim()+'</td>').join('')+'</tr>');return t+'</table>'})
      .replace(/\\begin\{tabular\}\{[^}]+\}([\s\S]*?)\\end\{tabular\}/g,
        (_,tbl)=>{const rows=tbl.replace(/\\hline/g,'').split(/\\\\/).map(r=>r.trim()).filter(r=>r);let t='<table>';rows.forEach(r=>t+='<tr>'+r.split('&').map(c=>'<td>'+c.trim()+'</td>').join('')+'</tr>');return t+'</table>'})
      .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g,'<div class="math display">\\[$1\\]</div>')
      .replace(/\$([^$\n]+)\$/g,'<span class="math inline">\\($1\\)</span>');

    // --- Apply centering to marked sections AFTER all other processing ---
    body = body.replace(/__CENTER_START__([\s\S]*?)__CENTER_END__/g, (match, content) => {
      return `<div class="center">${content}</div>`;
    });
    // Remove any stray __CENTER_START__ or __CENTER_END__
    body = body.replace(/__CENTER_START__/g, '');
    body = body.replace(/__CENTER_END__/g, '');

    // Split into paragraphs and wrap non-block elements
    return body.split(/\n{2,}/).map(p => p.trim()).filter(p => p)
      .map(p => /^<(h1|h2|h3|ul|ol|dl|table|figure|pre|blockquote|section|nav|div|hr)/.test(p)
        ? p : '<p>' + p.replace(/\n/g, ' ') + '</p>').join('');
  }

  // Render button handler
  const handleRender = () => {
    setHtml(convertTexToHtml(latex, imageMap));
  };
  // Open in new page handler
  const handleOpenNewPage = () => {
    // Google Fonts import for all font options
    const googleFonts = `@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Comic+Neue:wght@700&family=Indie+Flower&family=Quicksand:wght@400;600&family=Baloo+2:wght@400;700&family=Nunito:wght@400;700&family=Inter:wght@400;700&display=swap');`;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset='utf-8'><title>Rendered LaTeX</title><style>${googleFonts} body{margin:0;padding:0;background:${bgColor};font-family:${docFont};font-size:${docFontSize}px;line-height:1.7;color:${textColor};}#preview{width:75vw;max-width:75vw;min-width:320px;margin:0 auto;padding:48px 56px 48px 56px;overflow:auto;background:${bgColor};box-sizing:border-box;border-radius:24px;box-shadow:0 4px 32px #0002;font-size:${docFontSize}px;font-family:${docFont};line-height:1.7;color:${textColor};}#preview * { text-align: left; }#preview .center, #preview .center * { text-align: center !important; }#preview .center > *, #preview .center img { display: block; margin-left: auto; margin-right: auto; }#preview table { width:100%; border-collapse:collapse; margin:1em 0; background: #fff; border-radius: 12px; overflow: auto; box-shadow: 0 2px 8px #0001;}#preview th,#preview td { border:1.5px solid #999; padding:0.5em; text-align:center; font-size:inherit;}#preview caption { caption-side:top; font-weight:bold; margin-bottom:.5em; font-size:1.1em; color:${textColor}; background:transparent;}#preview .table-scroll { overflow-x:auto; }#preview h1,h2,h3 { margin:1em 0 .5em; }#preview ul, #preview dl { margin:.5em 0  .5em 1.5em }#preview p { margin:.5em 0 }#preview pre { background:#f5f5f5; padding:1em; overflow:auto }#preview blockquote { border-left:4px solid #ccc; padding-left:1em; margin:1em 0 }#preview .proof { border:1px solid #ccc; padding:1em; margin:1em 0 }#preview .abstract { font-style:italic; margin:1em 0; }#preview .bibliography { margin:1em 0 }#preview .bibliography h2 { margin-bottom:.5em }#preview .bibliography ul { list-style-type:none; padding-left:0 }#preview .bibliography li { margin-bottom:.5em }#preview header.title { margin:1em 0; }#preview header.title h1 { margin:0; font-size:1.8em; }#preview header.title .author, #preview header.title .date { margin:0.2em 0; color:#555; }#preview nav.toc ul { list-style:none; padding:0; }#preview nav.toc li { margin:0.2em 0; }#preview .toc-level-2 { margin-left:1em; }#preview .toc-level-3 { margin-left:2em; }#preview .page-break { page-break-after:always; height:0; }#preview .definition { border: 1px solid #8c8; background: #f8fff8; padding: 1em; margin: 1em 0; }#preview .theorem { border: 1px solid #88c; background: #f8f8ff; padding: 1em; margin: 1em 0; }#preview figure.listing { margin: 1em 0; }#preview figure.listing figcaption { font-style: italic; margin-bottom: .5em; }#preview figure.listing pre { background: #f5f5f5; padding: 1em; overflow: auto; }.textimage { display: flex; gap: 2em; align-items: flex-start; margin: 2em 0; }.textimage-left { flex: 1; min-width: 0; }.textimage-right { flex: 0 0 auto; max-width: 400px; margin-left: 1em; }.textimage-right img { width: 80%; max-width: 100%; height: auto; border-radius: 8px; display: block; }#preview .sidebyside { display: flex; gap: 2em; align-items: flex-start; margin: 2em 0; }#preview .sidebyside-left { flex: 0 0 auto; max-width: 40%; display: flex; flex-direction: column; align-items: flex-start; }#preview .sidebyside-left img { max-width: 100%; height: auto; border-radius: 8px; }#preview .sidebyside-right { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: center; }` +
      `#preview .center { text-align: center; }` +
      `#preview .left { text-align: left; }` +
      `#preview .right { text-align: right; }` +
      `#preview .center > *, #preview .left > *, #preview .right > * { display: block; margin: 0 auto; }` +
      `#preview .center img, #preview .left img, #preview .right img { display: block; }` +
      `#preview .center img { margin: 0 auto; }` +
      `#preview .right img { margin: 0 0 0 auto; }` +
      `#preview .left img { margin: 0 auto 0 0; }` +
      `#preview .sidebyside { display: flex; gap: 2em; align-items: flex-start; margin: 2em 0; }` +
      `#preview .sidebyside-left { flex: 0 0 auto; max-width: 40%; display: flex; flex-direction: column; align-items: flex-start; }` +
      `#preview .sidebyside-left img { max-width: 100%; height: auto; border-radius: 8px; }` +
      `#preview .sidebyside-right { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: center; }` +
      `</style><script>window.MathJax={tex:{inlineMath:[["\\\\(","\\\\)"]],displayMath:[["\\\\[","\\\\]"]]},svg:{fontCache:"global"},startup:{ready:function(){console.log("MathJax ready in new window");window.MathJax.startup.defaultReady();window.MathJax.startup.promise.then(function(){console.log("Processing math...");window.MathJax.typesetPromise();});}}};let mathInterval=setInterval(function(){if(window.MathJax&&window.MathJax.typesetPromise){window.MathJax.typesetPromise();clearInterval(mathInterval);}},100);<\/script></head><body><div id='preview'>${convertTexToHtml(latex, imageMap)}</div><script src='https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js' onload="setTimeout(function(){if(window.MathJax&&window.MathJax.typesetPromise){window.MathJax.typesetPromise();}},500);"><\/script></body></html>`);
    win.document.close();
  };

  // File input handler
  const handleFileInput = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      if (codeMirrorRef.current) codeMirrorRef.current.setValue(r.result);
      setLatex(r.result);
    };
    r.readAsText(f);
  };

  // Font size handlers
  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
    if (codeMirrorRef.current) {
      codeMirrorRef.current.getWrapperElement().style.fontSize = newSize + 'px';
    }
  };

  // Image input handler
  const handleImageInput = (e) => {
    const newMap = new Map(imageMap);
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        newMap.set(file.name, reader.result);
        setImageMap(newMap);
      };
      reader.readAsDataURL(file);
    });
  };

  // Delete an uploaded image
  const handleDeleteImage = (name) => {
    const newMap = new Map(imageMap);
    newMap.delete(name);
    setImageMap(newMap);
    setHtml(convertTexToHtml(latex, newMap));
  };

  // --- Advanced code search/replace state ---
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]); // [{from, to}]
  const [currentResult, setCurrentResult] = useState(0);

  // Search in code
  const handleSearch = () => {
    if (!codeMirrorRef.current || !searchTerm) {
      setSearchResults([]);
      setCurrentResult(0);
      return;
    }
    const cm = codeMirrorRef.current;
    const doc = cm.getDoc();
    const cursor = doc.getSearchCursor(searchTerm, null, {caseFold: true, multiline: true});
    const results = [];
    while (cursor.findNext()) {
      results.push({from: cursor.from(), to: cursor.to()});
    }
    setSearchResults(results);
    setCurrentResult(results.length ? 0 : -1);
    if (results.length) {
      cm.setSelection(results[0].from, results[0].to);
      cm.scrollIntoView(results[0].from, 100);
    }
  };

  // Navigate search results
  const gotoResult = (dir) => {
    if (!searchResults.length) return;
    let idx = currentResult + dir;
    if (idx < 0) idx = searchResults.length - 1;
    if (idx >= searchResults.length) idx = 0;
    setCurrentResult(idx);
    const cm = codeMirrorRef.current;
    const res = searchResults[idx];
    cm.setSelection(res.from, res.to);
    cm.scrollIntoView(res.from, 100);
  };

  // Replace current
  const handleReplace = () => {
    if (!searchResults.length || currentResult < 0) return;
    const cm = codeMirrorRef.current;
    const res = searchResults[currentResult];
    cm.replaceRange(replaceTerm, res.from, res.to);
    setLatex(cm.getValue());
    setTimeout(handleSearch, 0);
  };
  // Replace all
  const handleReplaceAll = () => {
    if (!searchResults.length) return;
    const cm = codeMirrorRef.current;
    cm.operation(() => {
      for (let i = searchResults.length - 1; i >= 0; --i) {
        cm.replaceRange(replaceTerm, searchResults[i].from, searchResults[i].to);
      }
    });
    setLatex(cm.getValue());
    setTimeout(handleSearch, 0);
  };

  // --- Updated CSS styles (full screen, modern UI, no centering in LaTeX) ---
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
    html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; box-sizing: border-box; }
body { min-height: 100vh; min-width: 100vw; background: #f4f6fa; }
#toolbar { padding:16px 24px; background:#f8f9fb; display:flex; align-items:center; box-shadow:0 2px 8px #0001; border-radius:0 0 12px 12px; }
#toolbar>* { margin-right:16px; }
#toolbar input[type="file"] { border: none; background: none; }
#toolbar button { background: #1976d2; color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font-size: 1rem; cursor: pointer; transition: background 0.2s; }
#toolbar button:hover { background: #125ea2; }
#container { flex:1; display:flex; overflow:hidden; height: 1px; min-height:0; }
#editor {
  width: 50%;
  height: 100%;
  min-width: 320px;
  border: none;
  border-radius: 12px 0 0 12px;
  font-size: 1.2rem;
  text-align: left; /* Ensure text is left-aligned */
}
.CodeMirror {
  height: 100% !important;
  font-size: 1.2rem;
  border-radius: 12px 0 0 12px;
  background: #fff;
  text-align: left; /* Ensure text is left-aligned */
}
#preview { 
  width:75vw;
  max-width:75vw;
  min-width: 320px;
  margin:0 auto;
  padding:48px 56px 48px 56px;
  overflow:auto; 
  background:#fffbe7; 
  box-sizing:border-box; 
  border-radius: 24px; 
  box-shadow: 0 4px 32px #0002;
  font-size: ${docFontSize}px;
  font-family: 'Caveat', 'Comic Neue', 'Indie Flower', cursive, sans-serif;
  line-height: 1.7;
}
#preview * { text-align: left !important; }
#preview table { width:100%; border-collapse:collapse; margin:1em 0 }
#preview th,#preview td { border:1px solid #999; padding:0.5em; text-align:left }
#preview caption { caption-side:top; font-weight:bold; margin-bottom:.5em }
#preview h1,h2,h3 { margin:1em 0 .5em; }
#preview ul, #preview dl { margin:.5em 0  .5em 1.5em }
#preview p { margin:.5em 0 }
#preview pre { background:#f5f5f5; padding:1em; overflow:auto }
#preview blockquote { border-left:4px solid #ccc; padding-left:1em; margin:1em 0 }
#preview .proof { border:1px solid #ccc; padding:1em; margin:1em 0 }
#preview .abstract { font-style:italic; margin:1em 0; }
#preview .bibliography { margin:1em 0 }
#preview .bibliography h2 { margin-bottom:.5em }
#preview .bibliography ul { list-style-type:none; padding-left:0 }
#preview .bibliography li { margin-bottom:.5em }
#preview header.title { margin:1em 0; }
#preview header.title h1 { margin:0; font-size:1.8em; }
#preview header.title .author, #preview header.title .date { margin:0.2em 0; color:#555; }
#preview nav.toc ul { list-style:none; padding:0; }
#preview nav.toc li { margin:0.2em 0; }
#preview .toc-level-2 { margin-left:1em; }
#preview .toc-level-3 { margin-left:2em; }
#preview .page-break { page-break-after:always; height:0; }
#preview .definition {
  border: 1px solid #8c8;
  background: #f8fff8;
  padding: 1em;
  margin: 1em 0;
}
#preview .theorem {
  border: 1px solid #88c;
  background: #f8f8ff;
  padding: 1em;
  margin: 1em 0;
}
#preview figure.listing {
  margin: 1em 0;
}
#preview figure.listing figcaption {
  font-style: italic;
  margin-bottom: .5em;
}
#preview figure.listing pre {
  background: #f5f5f5;
  padding: 1em;
  overflow: auto;
}
hr { border: none; border-top: 2px solid #ccc; margin: 2em 0; }
#preview .center { text-align: center; }
#preview .left { text-align: left; }
#preview .right { text-align: right; }
#preview .center > *, #preview .left > *, #preview .right > * { display: block; margin: 0 auto; }
#preview .center img, #preview .left img, #preview .right img { display: block; }
#preview .center img { margin: 0 auto; }
#preview .right img { margin: 0 0 0 auto; }
#preview .left img { margin: 0 auto 0 0; }
#preview .sidebyside {
  display: flex;
  gap: 2em;
  align-items: flex-start;
  margin: 2em 0;
}
#preview .sidebyside-left {
  flex: 0 0 auto;
  max-width: 40%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
#preview .sidebyside-left img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
#preview .sidebyside-right {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
#preview .textimage {
  display: flex;
  gap: 2em;
  align-items: flex-start;
  margin: 2em 0;
}
#preview .textimage-left {
  flex: 1;
  min-width: 0;
}
#preview .textimage-right {
  flex: 0 0 auto;
  max-width: 400px;
  margin-left: 1em;
}
#preview .textimage-right img {
  width: 80%;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
}
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Comic+Neue:wght@700&family=Indie+Flower&family=Quicksand:wght@400;600&family=Baloo+2:wght@400;700&family=Nunito:wght@400;700&family=Inter:wght@400;700&display=swap');
`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [fontSize, docFontSize]); // Add both font sizes as dependencies

  // Mouse event handlers for resizing
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const container = document.getElementById('container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let ratio = x / rect.width;
      ratio = Math.max(0.15, Math.min(0.85, ratio)); // Clamp between 15% and 85%
      setDividerX(ratio);
    };
    const onMouseUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Download project as zip
  const handleDownload = async () => {
    const zip = new JSZip();
    // Add LaTeX source
    zip.file('main.tex', latex);
    // Add images
    for (const [name, dataUrl] of imageMap.entries()) {
      // Extract base64 data and mime type
      const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
      if (match) {
        const mime = match[1];
        const b64 = match[2];
        zip.file(name, b64, {base64: true});
      }
    }
    // Add a minimal HTML preview
    const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>LaTeX Preview</title><script src='https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js'></script></head><body><pre id='latex'></pre><script>document.getElementById('latex').textContent = ` + JSON.stringify(latex) + `;</script></body></html>`;
    zip.file('index.html', html);
    // Generate and trigger download
    const blob = await zip.generateAsync({type: 'blob'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'latex-project.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  // Open project from zip
  const handleOpenZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const zip = await JSZip.loadAsync(file);
    // Read main.tex
    const texFile = zip.file('main.tex');
    if (!texFile) { alert('main.tex not found in archive'); return; }
    const tex = await texFile.async('string');
    // Read images
    const newImageMap = new Map();
    await Promise.all(Object.values(zip.files).map(async (zf) => {
      if (zf.name !== 'main.tex' && zf.name !== 'index.html' && !zf.dir) {
        const ext = zf.name.split('.').pop().toLowerCase();
        let mime = 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'svg') mime = 'image/svg+xml';
        else if (ext === 'gif') mime = 'image/gif';
        else if (ext === 'webp') mime = 'image/webp';
        else if (ext === 'bmp') mime = 'image/bmp';
        const b64 = await zip.file(zf.name).async('base64');
        newImageMap.set(zf.name, `data:${mime};base64,${b64}`);
      }
    }));
    setLatex(tex);
    if (codeMirrorRef.current) codeMirrorRef.current.setValue(tex);
    setImageMap(newImageMap);
    setHtml(convertTexToHtml(tex, newImageMap));
  };

  return (
    <div style={{height:'100vh',width:'100vw',display:'flex',flexDirection:'column',margin:0,padding:0,boxSizing:'border-box'}}>
      <div id="toolbar">
        {/* Remove .tex upload button, move search/replace UI to the left */}
        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
          <input type="text" placeholder="Search" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{width:120}} />
          <button onClick={handleSearch}>Find</button>
          <button onClick={()=>gotoResult(-1)} disabled={!searchResults.length}>Prev</button>
          <button onClick={()=>gotoResult(1)} disabled={!searchResults.length}>Next</button>
          <input type="text" placeholder="Replace" value={replaceTerm} onChange={e=>setReplaceTerm(e.target.value)} style={{width:120}} />
          <button onClick={handleReplace} disabled={!searchResults.length}>Replace</button>
          <button onClick={handleReplaceAll} disabled={!searchResults.length}>Replace All</button>
          <span style={{fontSize:'0.9em',color:'#555',marginLeft:'4px'}}>{searchResults.length ? `${currentResult+1}/${searchResults.length}` : ''}</span>
        </div>
        <button id="render" onClick={handleRender}>Render</button>
        <input type="file" id="imageInput" accept="image/*" multiple onChange={handleImageInput} />
        <button id="download" onClick={handleDownload}>Download</button>
        <button id="openZipBtn" type="button" onClick={() => document.getElementById('openZipInput').click()}>Open</button>
        <input type="file" id="openZipInput" accept=".zip" style={{display:'none'}} onChange={handleOpenZip} />
        <button id="openNewPage" onClick={handleOpenNewPage} style={{marginLeft: 'auto'}}>Open Rendered in New Page</button>
        {/* Font size controls */}
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label style={{fontSize: '0.9rem', color: '#555'}}>Editor:</label>
          <button onClick={() => handleFontSizeChange(Math.max(10, fontSize - 2))} style={{padding: '4px 8px', fontSize: '0.8rem'}}>A-</button>
          <span style={{fontSize: '0.9rem', minWidth: '35px', textAlign: 'center'}}>{fontSize}px</span>
          <button onClick={() => handleFontSizeChange(Math.min(24, fontSize + 2))} style={{padding: '4px 8px', fontSize: '0.8rem'}}>A+</button>
        </div>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label style={{fontSize: '0.9rem', color: '#555'}}>Document:</label>
          <button onClick={() => setDocFontSize(Math.max(10, docFontSize - 2))} style={{padding: '4px 8px', fontSize: '0.8rem'}}>A-</button>
          <span style={{fontSize: '0.9rem', minWidth: '35px', textAlign: 'center'}}>{docFontSize}px</span>
          <button onClick={() => setDocFontSize(Math.min(32, docFontSize + 2))} style={{padding: '4px 8px', fontSize: '0.8rem'}}>A+</button>
          <input 
            type="range" 
            min="10" 
            max="32" 
            value={docFontSize} 
            onChange={(e) => setDocFontSize(parseInt(e.target.value))}
            style={{width: '100px'}}
          />
        </div>
        {/* Font selection */}
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label style={{fontSize: '0.9rem', color: '#555'}}>Font:</label>
          <select 
            value={docFont} 
            onChange={(e) => setDocFont(e.target.value)} 
            style={{padding: '4px', fontSize: '0.9rem', borderRadius: '4px', border: '1px solid #ccc'}}
          >
            {fontOptions.map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </select>
        </div>
        {/* Text color and background color */}
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label style={{fontSize: '0.9rem', color: '#555'}}>Text Color:</label>
          <input 
            type="color" 
            value={textColor} 
            onChange={(e) => setTextColor(e.target.value)} 
            style={{width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          />
          <label style={{fontSize: '0.9rem', color: '#555'}}>Background Color:</label>
          <input 
            type="color" 
            value={bgColor} 
            onChange={(e) => setBgColor(e.target.value)} 
            style={{width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          />
        </div>
      </div>
      <div id="container" style={{display:'flex',width:'100%',height:'100%',minHeight:0,flex:1,position:'relative',overflow:'hidden'}}>
        <div id="editor-zone" style={{width: `${dividerX*100}%`, minWidth: '120px', transition: dragging.current ? 'none' : 'width 0.2s', height:'100%'}}>
          <textarea id="editor" ref={editorRef} defaultValue={initialLatex} />
        </div>
        <div
          id="divider"
          style={{width: '8px', cursor: 'col-resize', background: dragging.current ? '#1976d2' : '#eee', zIndex: 2, userSelect: 'none'}}
          onMouseDown={() => { dragging.current = true; }}
        />
        <div id="preview-zone" style={{width: `${(1-dividerX)*100}%`, minWidth: '120px', transition: dragging.current ? 'none' : 'width 0.2s', height:'100%', overflow:'auto'}}>
          <div 
            id="preview" 
            style={{
              fontFamily: docFont || '"Latin Modern Roman", "Computer Modern", STIX, Times, serif',
              color: textColor,
              background: bgColor,
              fontSize: docFontSize,
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              margin: '0 auto',
              borderRadius: 24,
              boxShadow: '0 4px 32px #0002',
              padding: '48px 56px',
              lineHeight: 1.7
            }}
            dangerouslySetInnerHTML={{__html: html}} 
          />
        </div>
      </div>
      {/* Debug panel for uploaded images */}
      <div style={{padding:'1em',background:'#f9f9f9',borderTop:'1px solid #eee',fontSize:'0.95em'}}>
        <strong>Uploaded images:</strong>
        <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',gap:'2em'}}>
          {[...imageMap.entries()].map(([name, url]) => (
            <li key={name} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <span>{name}</span>
                <button style={{color:'#fff',background:'#d32f2f',border:'none',borderRadius:'4px',padding:'2px 8px',fontSize:'0.9em',cursor:'pointer'}} onClick={()=>handleDeleteImage(name)}>Delete</button>
              </div>
              <img src={url} alt={name} style={{maxWidth:100,maxHeight:60,marginTop:4,border:'1px solid #ccc',borderRadius:4}} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
