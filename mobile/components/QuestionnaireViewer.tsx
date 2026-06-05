import React from 'react';
import { WebView } from 'react-native-webview';
import { IMidTest } from '@/types';

function generateQuestionnaireHtml(midTest: IMidTest, currentQuestionIndex: number) {
  const questionnaires = midTest.questionnaires || [];
  const currentQuestion = questionnaires[currentQuestionIndex];
  return `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #334155; line-height: 1.5; padding: 16px; }
        .questionnaire-container { max-width: 100%; margin: 0 auto; }
        .header { background: #3363AD; color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center; }
        .header h1 { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
        .header p { font-size: 14px; opacity: 0.9; }
        .question { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .question-text { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #1e293b; }
        .question-image { width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 16px; display: block; }
        .options { display: flex; flex-direction: column; gap: 12px; }
        .option { display: flex; align-items: flex-start; padding: 16px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .option-image { width: 100%; max-width: 100%; height: auto; border-radius: 6px; margin-top: 8px; display: block; }
        .option:hover { border-color: #3363AD; background: #f0f7ff; }
        .option.selected { border-color: #3363AD; background: #f0f7ff; }
        .option.correct { border-color: #22c55e; background: #e7fbe9; }
        .option.incorrect { border-color: #ef4444; background: #fde8e8; }
        .option.disabled { pointer-events: none; opacity: 0.7; }
        .option-radio { width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 50%; margin-right: 12px; margin-top: 2px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; }
        .option.selected .option-radio::after { content: ''; width: 10px; height: 10px; background: #3363AD; border-radius: 50%; }
        .option-checkbox { width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 4px; margin-right: 12px; margin-top: 2px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .option.selected .option-checkbox { background: #3363AD; border-color: #3363AD; }
        .option.selected .option-checkbox::after { content: '✓'; color: white; font-size: 14px; font-weight: bold; }
        .option-text { flex: 1; font-size: 14px; color: #475569; }
        .option.selected .option-text { color: #1e293b; font-weight: 500; }
        .option.correct .option-text { color: #22c55e; font-weight: 600; }
        .option.incorrect .option-text { color: #ef4444; font-weight: 600; }
        .progress { text-align: center; margin-bottom: 16px; font-size: 14px; color: #64748b; }
        .navigation { display: none; }
        .submit-btn { margin-top: 24px; width: 100%; padding: 14px 0; background: #3363AD; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .submit-btn:disabled { background: #b6c6e3; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="questionnaire-container">
        <div class="question">
            <div class="header">
                <p>${currentQuestion?.question || 'No question text'}</p>
            </div>
            ${currentQuestion?.questionImage ? `<img src="${currentQuestion.questionImage}" alt="Question image" class="question-image" />` : ''}
            <div class="options" id="options-list">
                ${(currentQuestion?.options || []).map((opt, optIndex) => `
                    <div class="option" onclick="selectOption(${currentQuestionIndex}, ${optIndex})" id="option-${currentQuestionIndex}-${optIndex}">
                        <div class="${currentQuestion?.allowMultiple ? 'option-checkbox' : 'option-radio'}"></div>
                        <div class="option-content" style="flex: 1;">
                            <div class="option-text">${opt.label || 'No option text'}</div>
                            ${opt.image ? `<img src="${opt.image}" alt="Option image" class="option-image" />` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="submit-btn" id="submit-btn" disabled>Emeza</button>
        </div>
    </div>
    <script>
        const totalQuestions = ${questionnaires.length};
        const currentQuestionIdx = ${currentQuestionIndex};
        const answers = {};
        const questions = ${JSON.stringify(questionnaires)};
        const midTestId = '${midTest.id}';
        let currentSelectedOption = null;
        let submitted = false;
        let selectedOptions = [];
        const correctAnswers = (questions[currentQuestionIdx]?.answers || []).map(a => a.label);
        const allowMultiple = questions[currentQuestionIdx]?.allowMultiple || false;
        function selectOption(questionIndex, optionIndex) {
            if (submitted) return;
            const currentQuestion = questions[questionIndex];
            const selectedOption = currentQuestion?.options[optionIndex];
            const optionEl = document.getElementById('option-' + questionIndex + '-' + optionIndex);
            if (!allowMultiple) {
                // Deselect all
                for (let i = 0; i < currentQuestion.options.length; i++) {
                    const el = document.getElementById('option-' + questionIndex + '-' + i);
                    el.classList.remove('selected');
                }
                optionEl.classList.add('selected');
                selectedOptions = [optionIndex];
            } else {
                const isSelected = optionEl.classList.contains('selected');
                if (isSelected) {
                    optionEl.classList.remove('selected');
                    selectedOptions = selectedOptions.filter(idx => idx !== optionIndex);
                } else {
                    optionEl.classList.add('selected');
                    selectedOptions.push(optionIndex);
                }
            }
            // Enable submit if at least one selected
            document.getElementById('submit-btn').disabled = selectedOptions.length === 0;
        }

        // New: show feedback modal function (hoisted so it can be called after banner removal)
        function showFeedbackModal(message) {
          if (!message) return;
          try {
            // Notify React Native that feedback modal is opening - disable navigation
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'feedbackModalState',
                isOpen: true
              }));
            }

            const overlay = document.createElement('div');
            overlay.className = 'feedback-overlay';
            overlay.style.position = 'fixed';
            overlay.style.left = '0';
            overlay.style.top = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(0,0,0,0.5)';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = '10000';
            overlay.style.padding = '20px';

            const modal = document.createElement('div');
            modal.className = 'feedback-modal';
            // keep minimal inline layout values; detailed styling moved to CSS below
            modal.style.position = 'relative';
            modal.style.boxSizing = 'border-box';
            modal.style.maxHeight = '80vh';
            modal.style.overflowY = 'auto';

            // build header with title + close button for better UX
            const header = document.createElement('div');
            header.className = 'feedback-header';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'feedback-close';
            closeBtn.innerHTML = '✕';
            closeBtn.setAttribute('aria-label', 'Close feedback');

            const content = document.createElement('div');
            content.className = 'feedback-content';
            content.style.marginTop = '6px';
            content.style.fontSize = '15px';
            content.style.color = '#334155';
            // allow safe HTML from server (basic) - use innerText if you want raw text
            content.innerHTML = message;

            header.appendChild(closeBtn);
            modal.appendChild(header);
            // append close button directly to modal so it sits at the modal's top-right and does not overlap header/content
            modal.appendChild(closeBtn);
            modal.appendChild(content);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            function closeModal() {
              try { overlay.style.opacity = '0'; } catch(e){}
              setTimeout(() => { 
                try { document.body.removeChild(overlay); } catch(e){}
                // Notify React Native that feedback modal is closing - enable navigation
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'feedbackModalState',
                    isOpen: false
                  }));
                }
              }, 220);
            }

            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', function(e) {
              if (e.target === overlay) closeModal();
            });

            document.addEventListener('keydown', function escHandler(e){
              if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
              }
            });
          } catch (e) {
            console.log('showFeedbackModal error', e);
          }
        }

        document.getElementById('submit-btn').onclick = function() {
            if (submitted || selectedOptions.length === 0) return;
            submitted = true;
            const submitBtn = document.getElementById('submit-btn');
            // Disable button immediately to prevent double clicks
            submitBtn.disabled = true;
            
            // Highlight correct/incorrect
            const currentQuestion = questions[currentQuestionIdx];
            for (let i = 0; i < currentQuestion.options.length; i++) {
                const el = document.getElementById('option-' + currentQuestionIdx + '-' + i);
                el.classList.add('disabled');
                const label = currentQuestion.options[i].label;
                if (correctAnswers.includes(label)) {
                    el.classList.add('correct');
                }
                if (selectedOptions.includes(i) && !correctAnswers.includes(label)) {
                    el.classList.add('incorrect');
                }
            }
            // Determine correctness (supports single and multiple)
            try {
              const selectedLabels = selectedOptions.map(idx => currentQuestion.options[idx].label);
              const uniqueSelected = Array.from(new Set(selectedLabels));
              const uniqueCorrect = Array.from(new Set(correctAnswers));
              const isSameLength = uniqueSelected.length === uniqueCorrect.length;
              const allMatch = uniqueSelected.every(l => uniqueCorrect.includes(l));
              const isCorrect = isSameLength && allMatch;

              // Disable navigation buttons immediately while processing
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'feedbackModalState',
                  isOpen: true
                }));
              }

              // Send result to React Native immediately (before animations)
              if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'questionnaireSubmitted',
                      selectedOptions: selectedOptions.map(idx => currentQuestion.options[idx].label),
                      correctAnswers: correctAnswers
                  }));
              }

              // Create result banner
              const banner = document.createElement('div');
              banner.className = 'result-banner ' + (isCorrect ? 'correct' : 'incorrect');
              banner.textContent = isCorrect ? 'Nibyo, Igisubizo cyawe nicyo!' : 'Igisubizo cyawe sicyo';
              document.body.appendChild(banner);
              setTimeout(() => {
                try { banner.style.opacity = '0'; } catch(e){}
                setTimeout(() => { 
                  try { document.body.removeChild(banner); } catch(e){}
                  // Show feedback modal immediately when answer is incorrect and feedback exists
                  if (!isCorrect) {
                    const fb = (questions[currentQuestionIdx] && questions[currentQuestionIdx].feedbackStatement) ? questions[currentQuestionIdx].feedbackStatement : '';
                    if (fb && String(fb).trim().length > 0) {
                      try { showFeedbackModal(fb); } catch(e) { console.log('feedback modal show error', e); }
                    }
                  } else {
                    // If answer is correct, enable navigation buttons
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'feedbackModalState',
                        isOpen: false
                      }));
                    }
                  }
                }, 0);
              }, 1500);
            } catch(e) { console.log('result banner error', e); }
        };
        // result banner + feedback styles (improved banner sizing)
        const styleEl = document.createElement('style');
        styleEl.innerHTML = " .result-banner { position: fixed; left: 50%; top: 12px; transform: translateX(-50%); padding: 12px 20px; border-radius: 10px; color: #fff; font-weight: 800; z-index: 9999; opacity: 1; transition: opacity 0.3s ease, transform 0.25s ease; box-shadow: 0 8px 26px rgba(0,0,0,0.22); font-size: 16px; min-width: 280px; max-width: 92%; text-align: center; } .result-banner.correct { background: #16a34a; } .result-banner.incorrect { background: #ef4444; } @media (min-width: 700px) { .result-banner { font-size: 18px; padding: 14px 26px; min-width: 360px; } } @keyframes rb-slide-down { from { transform: translateX(-50%) translateY(-6px); opacity: 0 } to { transform: translateX(-50%) translateY(0); opacity: 1 } } .result-banner { animation: rb-slide-down 220ms ease; } " +
        " .feedback-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(2,6,23,0.55); z-index: 10000; padding: 20px; animation: fv-fade-in 180ms ease; } " +
        " .feedback-modal { background: #fff; border-radius: 12px; padding: 18px 22px; width: min(760px, 96%); max-width: 760px; box-shadow: 0 18px 36px rgba(2,6,23,0.28); color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden; } " +
        " .feedback-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; position: relative; } " +
        " .feedback-close { position: absolute; top: 2px; right: 10px; background: transparent; border: none; font-size: 18px; cursor: pointer; color: #475569; padding: 6px; border-radius: 8px; z-index: 2; } " +
        " .feedback-close:hover, .feedback-close:focus { background: #f1f5f9; outline: none; } " +
        " .feedback-content { font-size: 15px; color: #334155; line-height: 1.5; max-height: calc(80vh - 80px); overflow-y: auto; } " +
        " @keyframes fv-fade-in { from { opacity: 0 } to { opacity: 1 } } " +
        " @keyframes fv-slide-up { from { transform: translateY(8px); opacity: 0 } to { transform: translateY(0); opacity: 1 } } ";
        document.head.appendChild(styleEl);
     </script>
</body>
</html>`;
}

const QuestionnaireViewer: React.FC<{ 
  midTest: IMidTest; 
  currentQuestionIndex: number; 
  onMessage?: (event: any) => void;
}> = ({ midTest, currentQuestionIndex, onMessage }) => {
  return (
    <WebView
      source={{ html: generateQuestionnaireHtml(midTest, currentQuestionIndex) }}
      originWhitelist={["*"]}
      style={{ flex: 1, width: '100%', height: '100%' }}
      javaScriptEnabled={true}
      scalesPageToFit={false}
      startInLoadingState={true}
      onMessage={onMessage}
    />
  );
};

export default QuestionnaireViewer;