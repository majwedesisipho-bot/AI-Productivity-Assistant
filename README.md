# AI Workplace Hub

Build a modern, responsive web application called AI Workplace Productivity Assistant.

The application must be ONE integrated AI-powered productivity platform, not separate applications. It should demonstrate practical AI implementation, strong prompt engineering, real-world problem solving, responsible AI use, and modern UI/UX.

1. Technology

Use:

React

TypeScript

Tailwind CSS

Shadcn UI

Lucide React icons

Use a clean component-based structure and reusable components.

If connecting to an AI API, keep API keys secure using environment variables and server-side handling. Never expose API keys in the frontend.

If a live AI API is not available in preview, use a functional dynamic demo/fallback that generates responses based on the user's actual input rather than unrelated static examples.

2. Design and UI/UX

Create a professional, modern SaaS-style interface.

Design requirements:

Light/white background

Dark navy sidebar

Indigo/blue/purple accent colours

Clean typography using Inter or a similar modern font

Rounded cards

Subtle shadows

Clear spacing and hierarchy

Professional but simple appearance

Fully responsive on desktop, tablet, and mobile

The application must feel like a realistic workplace productivity platform.

3. Main Layout

Create one dashboard with:

Sidebar Navigation

Dashboard

Smart Email Generator

Meeting Notes Summarizer

AI Task Planner

AI Research Assistant

AI Chatbot

Settings

The sidebar should collapse on desktop and become a mobile drawer on smaller screens.

Top Navigation

Include:

Application name/logo

Current page title

Search field

Notification icon

User/profile area

4. Dashboard

Create a useful dashboard that provides an overview of the productivity tools.

Include:

Welcome message

Quick action buttons for the five AI tools

Simple productivity statistics

Recent activity

Recent generated outputs

Short productivity insight

Do not create complicated analytics. Keep the dashboard simple and functional.

5. Smart Email Generator

Create a realistic AI email-generation tool.

Input fields:

Recipient name

Recipient role/company (optional)

Email purpose:

Request

Follow-up

Meeting invitation

Apology

Update

Thank you

Complaint

Job/application communication

Custom

Key points/context

Tone:

Formal

Friendly

Persuasive

Length:

Short

Medium

Detailed

Desired action:

Request a response

Request a meeting

Request approval

Request an update

No specific action

AI Output:

Generate:

Subject line

Greeting

Professional email body

Clear call-to-action

Closing

The user must be able to:

Edit the generated email

Copy the email

Regenerate it

Clear the form/output

Show loading, empty, error, and success states.

6. Meeting Notes Summarizer

Create a tool that converts long meeting notes or transcripts into structured information.

Input fields:

Meeting title

Date

Attendees

Meeting notes/transcript

AI Output:

Display:

Executive summary

Key decisions

Action items

Responsible person/owner

Deadlines

Important milestones

Open questions

Action items should appear as editable cards with checkboxes.

Allow users to:

Edit action items

Mark action items as complete

Copy the summary

Regenerate the summary

Clear the results

Include a button:

"Add Action Items to Task Planner"

This should transfer the meeting action items into the Task Planner.

7. AI Task Planner / Scheduler

Create a realistic AI task planning and scheduling tool.

Input:

Allow users to add multiple tasks with:

Task name

Description

Priority

Due date

Estimated duration

Category

Allow the user to choose:

Daily plan

Weekly plan

Allow users to set:

Working start time

Working end time

Optional break times

AI Output:

Generate:

Priority ranking

Recommended schedule

Urgent tasks

At-risk tasks

Remaining tasks

Productivity recommendations

Display the schedule using clear cards or a timeline showing:

Date

Time

Task

Priority

Duration

Status

Allow users to:

Edit tasks

Change priority

Mark tasks complete

Delete tasks

Regenerate the plan

The planner should consider deadlines, priority, estimated duration, and available working hours when creating the schedule.

8. AI Research Assistant

Create an AI research assistant for workplace and academic research.

Input:

Research topic

Optional notes

Optional article/text provided by the user

Research depth:

Short

Medium

Detailed

AI Output:

Generate:

Research summary

Key insights

Important findings

Recommendations

Questions for further research

The output must be editable.

Allow users to:

Copy results

Edit results

Regenerate

Clear results

Include a visible reminder:

"Verify important facts and sources before using research results."

Do not pretend that the application has browsed or verified sources unless an actual browsing/API capability is connected.

9. AI Chatbot Interface

Create an interactive workplace AI assistant.

The chatbot should include:

Conversation history

User messages

AI responses

Text input

Send button

Loading state

Clear conversation button

Copy response button

Add useful prompt suggestions such as:

Draft an email

Summarize meeting notes

Plan my tasks

Research a topic

Organize my day

The chatbot should respond in a professional, concise, and helpful way.

10. Prompt Engineering

This is an important part of the project.

Every AI feature must use a structured prompt framework:

Role

Define what the AI is acting as.

Context

Provide the user's information and relevant background.

Objective

Clearly state what the AI must accomplish.

Constraints

Define tone, length, priorities, limitations, or other requirements.

Output Format

Specify exactly how the AI response should be structured.

Example structure:

Role → Context → Objective → Constraints → Output Format

The prompts should be dynamically populated using the user's inputs.

Do not use one generic prompt for every feature. Each tool should have a prompt specifically designed for its task.

11. Editable AI Outputs

All major AI-generated content must be editable.

Users should be able to:

Edit

Copy

Regenerate

Clear

AI output should never be treated as automatically final.

12. Real-World Integration

Make the tools work together as one platform.

At minimum, include:

Meeting Notes → Task Planner

When a meeting is summarized, users should be able to send the extracted action items directly into the Task Planner.

Also record important user actions in the Dashboard's Recent Activity section.

13. User Experience

Every AI tool must have:

Empty state

Loading state

Error state

Successful output state

Forms should have:

Clear labels

Helpful placeholders

Validation

Clear buttons

Logical layouts

Avoid unnecessary animations or complicated features.

14. Responsible AI

Include a visible responsible AI disclaimer in the application.

Use this wording:

"AI-generated outputs are produced using automated algorithms. Please review, edit, and verify all content before sending or implementing."

Also remind users:

"AI may make mistakes. Do not enter confidential, sensitive, or personal information unless allowed."

For research results, remind users to verify important facts and sources.

15. Responsive Design

The entire application must work properly on:

Desktop

Laptop

Tablet

Mobile

On mobile:

Sidebar becomes a drawer

Cards stack vertically

Forms remain easy to use

Textareas remain readable

Buttons remain accessible

Tables/schedules adapt to smaller screens

16. Settings

Keep Settings simple.

Include basic options such as:

Theme preference

Notification preference

Clear recent activity

Do not build complicated account-management functionality.

17. README

Create a professional README.md containing:

Project name

Project overview

Problem being solved

Main features

AI functionality

Prompt engineering approach

Technologies used

How to install and run the project

Environment variable/API setup

Responsible AI practices

Project contributors

18. Final Quality Requirements

Before completing the application, make sure:

It is ONE integrated productivity platform.

All five AI features are accessible from the same dashboard.

The interface is professional and responsive.

AI inputs produce relevant outputs.

Prompt engineering follows Role → Context → Objective → Constraints → Output Format.

AI outputs are editable.

Copy, regenerate, and clear functions work.

Loading, error, empty, and success states work.

Meeting action items can be transferred to the Task Planner.

The responsible AI disclaimer is visible.

No API keys are exposed in the frontend.

The application does not claim to perform actions it cannot actually perform.

The README is included.

Avoid unnecessary features that do not contribute to the project requirements.

The final result should look and function like a real-world AI productivity platform that could realistically be used by professionals or students to manage everyday productivity tasks.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c3d4b8ec-b5c6-452c-8107-24c3df797ad5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
