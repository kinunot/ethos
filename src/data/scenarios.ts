export type CategoryId =
  | 'confidentiality'
  | 'conflicts'
  | 'integrity'
  | 'workplace';

export type Category = {
  id: CategoryId;
  name: string;
  description: string;
  icon: 'lock-closed' | 'git-compare' | 'school' | 'briefcase';
};

export type Choice = {
  text: string;
  /** 2 = strongest response, 1 = defensible but incomplete, 0 = problematic */
  score: 0 | 1 | 2;
  explanation: string;
};

export type Scenario = {
  id: string;
  category: CategoryId;
  title: string;
  situation: string;
  choices: Choice[];
  principle: string;
};

export const categories: Category[] = [
  {
    id: 'confidentiality',
    name: 'Confidentiality & Privacy',
    description: 'Handling data and information you were trusted with.',
    icon: 'lock-closed',
  },
  {
    id: 'conflicts',
    name: 'Conflicts of Interest',
    description: 'When personal interests and professional duties collide.',
    icon: 'git-compare',
  },
  {
    id: 'integrity',
    name: 'Academic & Work Integrity',
    description: 'Honesty about whose work it is and what it shows.',
    icon: 'school',
  },
  {
    id: 'workplace',
    name: 'Workplace Conduct',
    description: 'Respect, accountability, and speaking up.',
    icon: 'briefcase',
  },
];

export const scenarios: Scenario[] = [
  // ---------- Confidentiality & Privacy ----------
  {
    id: 'conf-1',
    category: 'confidentiality',
    title: 'The exposed database',
    situation:
      'While debugging a feature during your internship, you notice a storage bucket containing customer names and emails is publicly accessible. Nobody else seems to have noticed. Your task for the day is unrelated, and your team lead is in meetings until the afternoon.',
    choices: [
      {
        text: 'Report it immediately to your team lead and the security contact, with the details you saw.',
        score: 2,
        explanation:
          'Fast, direct reporting to the people who can fix it limits harm. Include what you saw and when, but not copies of the data.',
      },
      {
        text: 'Fix the permission yourself quietly so the problem goes away.',
        score: 1,
        explanation:
          'Closing the hole is well-intentioned, but changing production access without approval skips the incident process and hides that data may already have been exposed.',
      },
      {
        text: 'Wait until your task is done, then mention it casually later in the week.',
        score: 0,
        explanation:
          'Every hour of delay increases the risk to real people. Urgency matters more than convenience here.',
      },
      {
        text: 'Download a sample to prove how serious it is when you report it.',
        score: 0,
        explanation:
          'Copying personal data creates a new privacy problem. Screenshots of the settings, not the data, are enough evidence.',
      },
    ],
    principle: 'Report promptly through the proper channel and never copy data you do not need.',
  },
  {
    id: 'conf-2',
    category: 'confidentiality',
    title: 'The helpful screenshot',
    situation:
      'You are stuck on a bug and want help from a friend on a coding forum. The easiest way to explain it is to post a screenshot of your company\'s internal admin dashboard, which shows some customer records.',
    choices: [
      {
        text: 'Post it as is. The bug is the point, and the forum is mostly students.',
        score: 0,
        explanation:
          'Public posts are permanent and searchable. Customer records and internal tools are confidential regardless of who you expect to see them.',
      },
      {
        text: 'Blur the names and post it.',
        score: 1,
        explanation:
          'Better, but the dashboard layout and remaining fields can still leak internal details, and blurring is easy to get wrong.',
      },
      {
        text: 'Recreate the problem in a small example with fake data, and ask there.',
        score: 2,
        explanation:
          'A minimal reproducible example protects confidential data and usually gets better help anyway.',
      },
      {
        text: 'Ask a teammate internally first, and only go outside if the company allows it.',
        score: 2,
        explanation:
          'Using internal channels and checking policy respects the trust placed in you. This is also a strong choice.',
      },
    ],
    principle: 'Confidential information stays inside approved boundaries, even when sharing seems harmless.',
  },
  {
    id: 'conf-3',
    category: 'confidentiality',
    title: 'The curious classmate',
    situation:
      'You are a teaching assistant with access to the grade book. A friend in the class asks you to just peek at whether they passed, because they are anxious and results are not out yet.',
    choices: [
      {
        text: 'Check quietly and tell them. It is only one grade and they are your friend.',
        score: 0,
        explanation:
          'Access to records is for your role, not for personal favors. It also treats this student differently from everyone else.',
      },
      {
        text: 'Decline kindly, explain that you cannot share grades early, and point them to the official release date.',
        score: 2,
        explanation:
          'You stay fair to everyone and protect the trust your role depends on, without being cold to your friend.',
      },
      {
        text: 'Tell them the overall class average instead.',
        score: 1,
        explanation:
          'Less harmful, but still shares information the instructor has not released. Check what is allowed first.',
      },
    ],
    principle: 'Access granted for a role is not a license for personal use.',
  },

  // ---------- Conflicts of Interest ----------
  {
    id: 'coi-1',
    category: 'conflicts',
    title: 'The vendor\'s gift',
    situation:
      'You are helping your team choose between two software vendors. Vendor A sends you a gift basket and offers to fly you to their user conference, all expenses paid. Their product is good, but not clearly better than Vendor B\'s.',
    choices: [
      {
        text: 'Accept. A conference is great for learning, and it will not change your recommendation.',
        score: 0,
        explanation:
          'Even if you believe you are unbiased, others cannot know that. It creates an appearance of influence and probably a real bias.',
      },
      {
        text: 'Decline the gifts and travel, and tell your manager about the offer.',
        score: 2,
        explanation:
          'Declining protects the integrity of the decision, and disclosing lets your organization handle it properly.',
      },
      {
        text: 'Accept the gift basket but decline the trip.',
        score: 1,
        explanation:
          'Smaller gifts feel safer, but the line is blurry. Check your company\'s gift policy and disclose either way.',
      },
      {
        text: 'Accept, but also visit Vendor B so it is fair.',
        score: 0,
        explanation:
          'Balancing favors does not remove the conflict. The issue is the gift, not the fairness of your schedule.',
      },
    ],
    principle: 'Avoid and disclose anything that could reasonably look like it influences your judgment.',
  },
  {
    id: 'coi-2',
    category: 'conflicts',
    title: 'Hiring a friend',
    situation:
      'Your team is hiring for a junior developer role and you are on the interview panel. Your close friend applies. They are qualified, though not the strongest candidate on paper.',
    choices: [
      {
        text: 'Tell the hiring manager about the relationship and step back from evaluating this candidate.',
        score: 2,
        explanation:
          'Disclosure and recusal protect the candidate, the process, and you. It is a normal and respected move.',
      },
      {
        text: 'Stay on the panel but score them especially strictly to avoid favoritism.',
        score: 1,
        explanation:
          'Overcorrecting is still bias, just in the other direction, and it can hurt your friend unfairly.',
      },
      {
        text: 'Say nothing. You can be objective.',
        score: 0,
        explanation:
          'Undisclosed relationships undermine trust if discovered, even when you act fairly.',
      },
    ],
    principle: 'Disclose personal relationships and recuse yourself from decisions they touch.',
  },
  {
    id: 'coi-3',
    category: 'conflicts',
    title: 'The side project',
    situation:
      'You build a small app on weekends that happens to compete with a product your employer is planning to launch. You have not used any company time, devices, or code, but you do know about the launch plan.',
    choices: [
      {
        text: 'Keep it quiet and launch first. You built it on your own time.',
        score: 0,
        explanation:
          'Using inside knowledge of a plan to get ahead conflicts with your duty of loyalty, even off the clock.',
      },
      {
        text: 'Read your contract and company policy, then disclose the project to your manager and agree on boundaries.',
        score: 2,
        explanation:
          'Checking obligations and being open turns a hidden conflict into a managed one.',
      },
      {
        text: 'Pause the project until the company launches, without telling anyone.',
        score: 1,
        explanation:
          'It avoids the worst outcome, but you may still have disclosure obligations you have not checked.',
      },
    ],
    principle: 'When loyalties overlap, check your obligations and be transparent.',
  },

  // ---------- Academic & Work Integrity ----------
  {
    id: 'int-1',
    category: 'integrity',
    title: '"Just this once"',
    situation:
      'A teammate on your group project is behind and asks to copy your solution for their part of an individual assignment because they are overwhelmed this week. They promise to do better next time.',
    choices: [
      {
        text: 'Send your code. They are your friend and clearly struggling.',
        score: 0,
        explanation:
          'Both of you would be committing academic dishonesty, and it does not solve the real problem.',
      },
      {
        text: 'Refuse, and offer to explain the concepts or pair on how to start.',
        score: 2,
        explanation:
          'Helping someone learn is fine. Handing over finished work is not. You support them without breaking the rules.',
      },
      {
        text: 'Refuse and report them to the instructor straight away.',
        score: 1,
        explanation:
          'Reporting is sometimes right, but starting with a conversation and an offer of real help is usually fairer for a first request.',
      },
      {
        text: 'Let them "borrow" it but tell them to change the variable names.',
        score: 0,
        explanation:
          'Disguising copied work makes it worse because it adds deliberate concealment.',
      },
    ],
    principle: 'Help others learn, not copy, and keep the work you submit honestly your own.',
  },
  {
    id: 'int-2',
    category: 'integrity',
    title: 'The inflated number',
    situation:
      'You are presenting results from a class project at a showcase. Your model\'s accuracy is 78%. A rival team reports 85%, and a mentor suggests rounding up and highlighting only your best test run.',
    choices: [
      {
        text: 'Follow the advice and present the best run as typical.',
        score: 0,
        explanation:
          'Selective reporting misleads your audience. Honest results, including weaknesses, are the foundation of credibility.',
      },
      {
        text: 'Report the real 78% with how you measured it, and explain what you would improve.',
        score: 2,
        explanation:
          'Accurate numbers with context show maturity, and audiences often respect honest limitations more than inflated claims.',
      },
      {
        text: 'Report 78% but leave out the weaker test splits.',
        score: 1,
        explanation:
          'The headline is true, but omitting relevant results can still give a misleading impression.',
      },
    ],
    principle: 'Report results as they are, including their limits.',
  },
  {
    id: 'int-3',
    category: 'integrity',
    title: 'AI-assisted work',
    situation:
      'Your course policy says AI tools may be used for "brainstorming and debugging" but submitted code must be your own. Under deadline pressure, you are tempted to have an AI tool write a whole module and submit it.',
    choices: [
      {
        text: 'Generate the whole module and submit it. Everyone does it.',
        score: 0,
        explanation:
          'It breaks the stated policy. Other people doing it does not make it permitted.',
      },
      {
        text: 'Use AI for hints and debugging, write the module yourself, and note how you used it.',
        score: 2,
        explanation:
          'This follows the policy and keeps the learning that the assignment exists for. Transparency protects you if questions come up.',
      },
      {
        text: 'Ask the instructor whether generating a starting skeleton is acceptable.',
        score: 2,
        explanation:
          'When a rule is unclear, asking before acting is exactly right.',
      },
      {
        text: 'Generate it, then rewrite some of it so it looks like yours.',
        score: 0,
        explanation:
          'Altering the output to hide where it came from adds concealment to the violation.',
      },
    ],
    principle: 'Follow the stated rules, ask when unsure, and be open about the help you used.',
  },

  // ---------- Workplace Conduct ----------
  {
    id: 'work-1',
    category: 'workplace',
    title: 'The overstated demo',
    situation:
      'Your manager asks you to tell a client that a feature "is live" in a demo. In reality it works only with mocked data and will not be ready for weeks. The client is deciding whether to renew.',
    choices: [
      {
        text: 'Do as asked. Your manager is responsible for the message.',
        score: 0,
        explanation:
          'Knowingly stating something false is your responsibility too. "Following orders" is not a defense.',
      },
      {
        text: 'Raise your concern privately and propose honest wording, such as "available in preview, full release in a few weeks".',
        score: 2,
        explanation:
          'You challenge the problem respectfully and offer a way to keep the deal without misleading anyone.',
      },
      {
        text: 'Go along in the meeting, but email the client afterward to correct it.',
        score: 1,
        explanation:
          'Correcting later is better than never, but it is better to avoid the false statement in the first place.',
      },
      {
        text: 'Go over your manager\'s head to the CEO immediately.',
        score: 1,
        explanation:
          'Escalation can be right, but usually only after you have raised it with your manager directly.',
      },
    ],
    principle: 'Do not make claims you know are misleading, and raise concerns early and constructively.',
  },
  {
    id: 'work-2',
    category: 'workplace',
    title: 'The meeting credit',
    situation:
      'In a team meeting, a senior colleague presents an idea that you shared with them privately last week, without mentioning your name. Leadership is clearly impressed.',
    choices: [
      {
        text: 'Say nothing and let it go. Causing friction could hurt your standing.',
        score: 1,
        explanation:
          'Choosing your battles is reasonable, but staying silent every time lets the pattern continue.',
      },
      {
        text: 'Interrupt and accuse them of stealing your idea in front of everyone.',
        score: 0,
        explanation:
          'A public accusation is likely to backfire and damage relationships, and you do not yet know their intent.',
      },
      {
        text: 'Talk to them privately, assume it was an oversight, and ask them to credit you going forward.',
        score: 2,
        explanation:
          'It addresses the issue directly, gives them a chance to fix it, and preserves the relationship.',
      },
      {
        text: 'Follow up in the meeting thread with "Glad this is moving, happy to help build on what we discussed."',
        score: 2,
        explanation:
          'A calm, professional way to put your involvement on record without confrontation.',
      },
    ],
    principle: 'Address issues directly and calmly, and give credit where it is due.',
  },
  {
    id: 'work-3',
    category: 'workplace',
    title: 'Your own mistake',
    situation:
      'You pushed a change last night that accidentally broke a report used by finance. It is not obvious who caused it, and the team is currently blaming a recent infrastructure update.',
    choices: [
      {
        text: 'Stay quiet. The infrastructure team will probably get blamed, but they can handle it.',
        score: 0,
        explanation:
          'Letting others take blame for your error is dishonest and also slows down the real fix.',
      },
      {
        text: 'Tell the team right away that your change is the likely cause, and offer to roll it back.',
        score: 2,
        explanation:
          'Owning the mistake quickly speeds up the fix and builds trust. Most teams respect this far more than the mistake itself.',
      },
      {
        text: 'Quietly revert your change without saying why.',
        score: 1,
        explanation:
          'It fixes the issue, but hides the cause, so the team can\'t learn or prevent a repeat.',
      },
    ],
    principle: 'Own your mistakes quickly and openly.',
  },
];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export function scenariosFor(category: CategoryId): Scenario[] {
  return scenarios.filter((s) => s.category === category);
}
