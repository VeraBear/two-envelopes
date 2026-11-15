const $ = id => document.getElementById(id);
let base = 10, low, high, chosen, other, roundPower, chosenPower, decisionStage, observedPower = 2;
const baseSteps = [.25,.5,.75,1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100];
const money = n => n < .01 && n > 0 ? `$${n.toPrecision(3)}` : n >= 1e9 ? `$${n.toExponential(2)}` : `$${n.toLocaleString('en-US',{maximumFractionDigits:2})}`;
const powerText = (b, n) => n === 0 ? '1' : `${b}<sup>${n}</sup>`;

function makeRound(){
  let heads = 0; while(Math.random() < .5 && heads < 9) heads++;
  roundPower = heads; low = base ** heads; high = low * base; chosen = other = null;
  document.querySelectorAll('.envelope').forEach(e => { e.classList.remove('open','dim'); e.querySelector('.seal').textContent='?'; e.disabled=false; });
  $('choiceActions').hidden = true; $('choiceActions').classList.remove('is-ready'); $('decisionQuiz').hidden = true; $('roundResult').hidden = true; $('newRound').hidden = true;
  $('gameTitle').textContent = 'Pick an envelope.'; $('gameNarration').textContent = `The envelopes are indistinguishable. One holds ${base} times the other.`;
  $('openPrompt').textContent = 'Click either envelope to reveal its amount. You will work through the odds before choosing whether to keep or switch.';
  $('coinTrail').innerHTML = Array.from({length:Math.min(heads+1,5)},(_,i)=>`<span>${i<heads?'H':'T'}</span>`).join('') + '<small>Harry’s hidden coin tosses</small>';
}
function selectEnvelope(id){
  if(chosen) return;
  const picked = $(id), unpicked = id === 'envelopeLeft' ? $('envelopeRight') : $('envelopeLeft');
  const firstOfPair = Math.random() < .5;
  chosen = firstOfPair ? low : high; other = firstOfPair ? high : low; chosenPower = firstOfPair ? roundPower : roundPower + 1;
  picked.classList.add('open'); picked.querySelector('.seal').textContent = money(chosen); unpicked.classList.add('dim');
  $('keepAmount').textContent = money(chosen); $('gameTitle').textContent = `You found ${money(chosen)}.`; $('gameNarration').textContent = 'Before you choose, work through the conditional odds and expectation.';
  $('openPrompt').textContent = 'Good. Your keep-or-switch decision unlocks after the two short questions below.';
  launchDecisionQuiz();
  requestAnimationFrame(() => $('decisionQuiz').scrollIntoView({behavior:'smooth', block:'center'}));
}
function finish(switched){
  document.querySelectorAll('.envelope').forEach(e=>e.disabled=true);
  const receive = switched ? other - 1 : chosen;
  $('roundResult').hidden=false; $('roundResult').innerHTML = switched ? `You switched. The other envelope held <strong>${money(other)}</strong>; after the $1 fee, you receive <strong>${money(receive)}</strong>.` : `You kept your envelope and receive <strong>${money(chosen)}</strong>. The other envelope held <strong>${money(other)}</strong>.`;
  $('choiceActions').hidden=true; $('newRound').hidden=false;
}
function switchExpectation(){
  if(base===1) return 0;
  if(chosenPower===0) return base-1;
  return (base**(chosenPower+1))/3 + (2*base**(chosenPower-1))/3 - 1;
}
function launchDecisionQuiz(){
  decisionStage=1; $('decisionQuiz').hidden=false; $('decisionNext').hidden=true; $('decisionFeedback').textContent=''; renderDecisionQuiz();
}
function renderDecisionQuiz(){
  const options=$('decisionOptions'); options.innerHTML='';
  if(decisionStage===1){
    $('decisionStep').textContent='Step 1 of 2 · Conditional probability';
    $('decisionQuestion').textContent=chosenPower===0 || base===1 ? `You see ${money(chosen)}. What can the other envelope contain?` : `You see ${money(chosen)}. Which outcome for the other envelope is more likely?`;
    const cases=base===1 ? [{label:`${money(chosen)} with certainty`,correct:true},{label:'A different amount',correct:false}] : chosenPower===0 ? [{label:`${money(base)} with certainty`,correct:true},{label:`${money(1/base)} with certainty`,correct:false}] : [{label:`${money(base**(chosenPower-1))} with probability 2/3`,correct:true},{label:`${money(base**(chosenPower+1))} with probability 1/3`,correct:false}];
    cases.forEach(c=>{const b=document.createElement('button'); b.type='button'; b.textContent=c.label; b.addEventListener('click',()=>answerConditional(c.correct)); options.appendChild(b);});
  } else {
    const expected=switchExpectation(); const relation=expected>chosen?'more':expected===chosen?'the same as':'less';
    $('decisionStep').textContent='Step 2 of 2 · Expected payoff';
    $('decisionQuestion').textContent=`After the $1 fee, is switching worth more, the same, or less than keeping ${money(chosen)}?`;
    ['more','the same as','less'].forEach(label=>{const b=document.createElement('button'); b.type='button'; b.textContent=label; b.addEventListener('click',()=>answerExpectation(label===relation,expected,relation)); options.appendChild(b);});
  }
}
function answerConditional(correct){
  if(!correct){$('decisionFeedback').textContent='Try again. Use the coin-toss setup: the observed amount can come from two adjacent pair sizes, except at the first level.';return;}
  $('decisionFeedback').textContent=chosenPower===0 || base===1 ? 'Correct. At the first level, there is only one possible partner envelope.' : 'Correct. The smaller adjacent power has probability 2/3; the larger adjacent power has probability 1/3.';
  $('decisionNext').hidden=false; $('decisionNext').textContent='Calculate the expectation'; $('decisionNext').onclick=()=>{decisionStage=2;$('decisionNext').hidden=true;$('decisionFeedback').textContent='';renderDecisionQuiz();};
}
function answerExpectation(correct,expected,relation){
  if(!correct){$('decisionFeedback').textContent='Try again—combine the conditional amounts from Step 1, then subtract the $1 fee.';return;}
  const formula=chosenPower===0 || base===1 ? `${money(base)} − $1` : `⅓ × ${money(base**(chosenPower+1))} + ⅔ × ${money(base**(chosenPower-1))} − $1`;
  $('decisionFeedback').innerHTML=`Correct. <strong>${formula} = ${money(expected)}</strong>, which is ${relation} ${money(chosen)}.`;
  $('decisionNext').hidden=false; $('decisionNext').textContent='Now make your choice'; $('decisionNext').onclick=()=>{$('decisionQuiz').hidden=true;$('choiceActions').hidden=false;$('choiceActions').classList.add('is-ready');$('choiceActions').scrollIntoView({behavior:'smooth',block:'center'});};
}
function updateReasoning(power){
  observedPower=power; const seen=base**power, higher=seen*base, lower=seen/base;
  document.querySelectorAll('[data-power]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.power)===power));
  $('seenAmount').textContent=money(seen);
  if(power===0){
    $('highStory').textContent=money(higher); $('lowStory').textContent='Impossible'; $('highProb').textContent='certainty'; $('lowProb').textContent='0 chance';
    $('switchMath').textContent=`1 × ${money(higher)} − $1`; $('switchValue').textContent=money(higher-1); $('mathNote').textContent=`Seeing $1 is special: there is no smaller positive power of ${base}.`;
  } else {
    const expected=(higher/3)+(2*lower/3)-1;
    $('highStory').textContent=money(higher); $('lowStory').textContent=money(lower); $('highProb').textContent='1/3 chance'; $('lowProb').textContent='2/3 chance';
    $('switchMath').textContent=`⅓ × ${money(higher)} + ⅔ × ${money(lower)} − $1`; $('switchValue').textContent=money(expected);
    $('mathNote').textContent=expected>seen ? `That is more than the ${money(seen)} you already hold. Locally, switch.` : expected===seen ? `That exactly matches ${money(seen)} before the $1 fee; switching is worse.` : `That is less than ${money(seen)}. With this base, keep the envelope.`;
  }
}
function updatePicker(){
  document.querySelector('.amount-picker div').innerHTML=[0,1,2,3,4].map(n=>`<button type="button" data-power="${n}">${money(base**n)}</button>`).join('');
  document.querySelectorAll('[data-power]').forEach(b=>b.addEventListener('click',()=>updateReasoning(Number(b.dataset.power))));
}
function levelContribution(n){ return ((1+base)/2) * ((base/2)**n); }
function updateSeries(){
  $('pairFormula').innerHTML = `${powerText(base,'n')} + ${powerText(base,'n+1')}`;
  $('seriesRows').innerHTML=[0,1,2,3].map(n=>`<p><span>${n}</span><span>1/${2**(n+1)}</span><span>${money(levelContribution(n))}</span></p>`).join('') + `<p><span>n</span><span>2<sup>−n−1</sup></span><span>${(1+base)/2} × (${base}/2)<sup>n</sup></span></p>`;
  const mode=base<2?'shrink':base===2?'same':'grow';
  $('seriesConclusion').textContent=base<2 ? `Each level contributes ${base/2}× as much as the prior one. Those contributions shrink to zero, so the expectation is finite.` : base===2 ? 'Each new level adds the same positive amount. Adding infinitely many of them still diverges.' : `Each rare level contributes ${base/2}× as much as the prior one. The expected value diverges.`;
  $('quizResponse').dataset.answer=mode; $('quizResponse').textContent='Choose an answer, then inspect the table.';
  document.querySelectorAll('[data-answer]').forEach(b=>b.classList.remove('correct','wrong'));
}
function setBase(next){
  base=next; observedPower=2;
  $('baseRange').value = baseSteps.indexOf(base); $('baseOutput').textContent = base < 1 ? `${base} = ${base === .25 ? '¼' : base === .5 ? '½' : '¾'}` : base;
  $('heroDescription').textContent=`Two envelopes. One holds ${base} times the other. You open one—and the seemingly rational choice leads somewhere strange.`;
  $('ruleBase').innerHTML=`If it takes <i>n</i> heads, he writes <i>${base}ⁿ</i> and <i>${base}ⁿ⁺¹</i> on the envelopes.`;
  updatePicker(); updateReasoning(observedPower); updateSeries(); makeRound();
}

$('envelopeLeft').addEventListener('click',()=>selectEnvelope('envelopeLeft'));
$('envelopeRight').addEventListener('click',()=>selectEnvelope('envelopeRight'));
$('keepButton').addEventListener('click',()=>finish(false)); $('switchButton').addEventListener('click',()=>finish(true)); $('newRound').addEventListener('click',makeRound);
$('baseRange').addEventListener('input', event=>setBase(baseSteps[Number(event.target.value)]));
document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
  const actual=$('quizResponse').dataset.answer, chosenAnswer=button.dataset.answer, correct=chosenAnswer===actual;
  document.querySelectorAll('[data-answer]').forEach(b=>b.classList.remove('correct','wrong'));
  button.classList.add(correct?'correct':'wrong');
  $('quizResponse').textContent=correct ? (actual==='shrink' ? `Exactly. The payout grows by only ${base}× while the chance halves, so every contribution is ${base/2}× the last. The tail fades away.` : actual==='same' ? 'Exactly. The terms do not get smaller; infinitely many equal positive terms still add to infinity.' : `Exactly. Probability halves, but the payout grows by ${base}×, so each level contributes ${base/2}× more.`) : (actual==='shrink' ? 'Look again: the probability drop wins. Each contribution is smaller than the last.' : actual==='same' ? 'Look again: each row adds the same positive amount.' : 'Look again: the payout outgrows the probability drop. Each contribution gets larger.');
}));
setBase(10);
