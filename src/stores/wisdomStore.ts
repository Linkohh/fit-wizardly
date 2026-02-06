/**
 * Wisdom AI Store
 * 
 * Manages conversation history, learning progress, and context for
 * the explainable AI training intelligence feature.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    WisdomMessage,
    WisdomResponse,
    WisdomContext,
    OptPhase,
    Plan,
} from '@/types/fitness';
import { generateWisdomResponse } from '@/lib/wisdomTemplates';

// ============================================
// LEARNING PROGRESS TYPES
// ============================================

interface LearningProgress {
    topicsExplored: string[];
    questionsAsked: number;
    conceptsUnderstood: string[];
    learningLevel: 'novice' | 'student' | 'scholar' | 'expert';
}

// ============================================
// WISDOM STATE INTERFACE
// ============================================

interface WisdomState {
    // Conversation state
    conversationHistory: WisdomMessage[];
    isLoading: boolean;

    // Learning progress
    learningProgress: LearningProgress;

    // Current context
    currentContext: WisdomContext;

    // UI state
    isOpen: boolean;

    // Actions - Conversation
    askQuestion: (question: string, planContext?: Plan) => Promise<WisdomResponse>;
    addMessage: (message: WisdomMessage) => void;
    clearConversation: () => void;

    // Actions - Context
    setContext: (context: Partial<WisdomContext>) => void;
    clearContext: () => void;

    // Actions - Learning
    markConceptUnderstood: (concept: string) => void;
    exploreTopic: (topic: string) => void;

    // Actions - UI
    toggleOpen: () => void;
    setOpen: (open: boolean) => void;

    // Getters
    getSuggestedQuestions: () => string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateLearningLevel(questionsAsked: number, conceptsUnderstood: number): LearningProgress['learningLevel'] {
    if (questionsAsked >= 50 && conceptsUnderstood >= 15) return 'expert';
    if (questionsAsked >= 25 && conceptsUnderstood >= 10) return 'scholar';
    if (questionsAsked >= 10 && conceptsUnderstood >= 5) return 'student';
    return 'novice';
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useWisdomStore = create<WisdomState>()(
    persist(
        (set, get) => ({
            // Initial state
            conversationHistory: [],
            isLoading: false,
            learningProgress: {
                topicsExplored: [],
                questionsAsked: 0,
                conceptsUnderstood: [],
                learningLevel: 'novice',
            },
            currentContext: {
                planId: null,
                exerciseId: null,
                weekNumber: 1,
                phase: undefined,
            },
            isOpen: false,

            // ========================================
            // CONVERSATION ACTIONS
            // ========================================

            askQuestion: async (question, planContext) => {
                const { conversationHistory, currentContext, learningProgress } = get();

                // Add user message
                const userMessage: WisdomMessage = {
                    id: `msg_${Date.now()}_user`,
                    role: 'user',
                    content: question,
                    timestamp: new Date(),
                };

                set((state) => ({
                    conversationHistory: [...state.conversationHistory, userMessage],
                    isLoading: true,
                    learningProgress: {
                        ...state.learningProgress,
                        questionsAsked: state.learningProgress.questionsAsked + 1,
                    },
                }));

                try {
                    // Generate response using template system
                    const response = await generateWisdomResponse(
                        question,
                        currentContext,
                        planContext,
                        conversationHistory
                    );

                    // Add assistant message
                    const assistantMessage: WisdomMessage = {
                        id: `msg_${Date.now()}_assistant`,
                        role: 'assistant',
                        content: response.content,
                        timestamp: new Date(),
                    };

                    // Update topics if new concepts introduced
                    const newTopics = response.conceptsIntroduced || [];

                    set((state) => {
                        const updatedTopics = [
                            ...new Set([...state.learningProgress.topicsExplored, ...newTopics])
                        ];

                        const newLevel = calculateLearningLevel(
                            state.learningProgress.questionsAsked,
                            state.learningProgress.conceptsUnderstood.length
                        );

                        return {
                            conversationHistory: [...state.conversationHistory, assistantMessage],
                            isLoading: false,
                            learningProgress: {
                                ...state.learningProgress,
                                topicsExplored: updatedTopics,
                                learningLevel: newLevel,
                            },
                        };
                    });

                    return response;
                } catch (error) {
                    set({ isLoading: false });

                    // Return error response
                    const errorResponse: WisdomResponse = {
                        content: "I'm having trouble understanding that question. Could you try rephrasing it?",
                        suggestedFollowUps: [
                            "Why is my plan structured this way?",
                            "What does RIR mean?",
                            "How many sets should I do?",
                        ],
                    };

                    return errorResponse;
                }
            },

            addMessage: (message) => {
                set((state) => ({
                    conversationHistory: [...state.conversationHistory, message],
                }));
            },

            clearConversation: () => {
                set({ conversationHistory: [] });
            },

            // ========================================
            // CONTEXT ACTIONS
            // ========================================

            setContext: (context) => {
                set((state) => ({
                    currentContext: { ...state.currentContext, ...context },
                }));
            },

            clearContext: () => {
                set({
                    currentContext: {
                        planId: null,
                        exerciseId: null,
                        weekNumber: 1,
                        phase: undefined,
                    },
                });
            },

            // ========================================
            // LEARNING ACTIONS
            // ========================================

            markConceptUnderstood: (concept) => {
                set((state) => {
                    const concepts = state.learningProgress.conceptsUnderstood;
                    if (concepts.includes(concept)) return state;

                    const updatedConcepts = [...concepts, concept];
                    const newLevel = calculateLearningLevel(
                        state.learningProgress.questionsAsked,
                        updatedConcepts.length
                    );

                    return {
                        learningProgress: {
                            ...state.learningProgress,
                            conceptsUnderstood: updatedConcepts,
                            learningLevel: newLevel,
                        },
                    };
                });
            },

            exploreTopic: (topic) => {
                set((state) => {
                    if (state.learningProgress.topicsExplored.includes(topic)) return state;

                    return {
                        learningProgress: {
                            ...state.learningProgress,
                            topicsExplored: [...state.learningProgress.topicsExplored, topic],
                        },
                    };
                });
            },

            // ========================================
            // UI ACTIONS
            // ========================================

            toggleOpen: () => {
                set((state) => ({ isOpen: !state.isOpen }));
            },

            setOpen: (open) => {
                set({ isOpen: open });
            },

            // ========================================
            // GETTERS
            // ========================================

            getSuggestedQuestions: () => {
                const { currentContext, learningProgress } = get();
                const suggestions: string[] = [];

                // Context-aware suggestions
                if (currentContext.exerciseId) {
                    suggestions.push(
                        "Why was this exercise chosen?",
                        "What muscles does this work?",
                        "Can I substitute this exercise?"
                    );
                } else if (currentContext.planId) {
                    suggestions.push(
                        "Why this many sets per muscle?",
                        "What is RIR and why does it matter?",
                        "How should I progress each week?"
                    );
                }

                // Level-based suggestions
                if (learningProgress.learningLevel === 'novice') {
                    suggestions.push(
                        "What does this workout split mean?",
                        "How heavy should I lift?",
                        "What if I can't do an exercise?"
                    );
                } else if (learningProgress.learningLevel === 'student') {
                    suggestions.push(
                        "How does volume affect hypertrophy?",
                        "When should I increase weight?",
                        "What's the science behind this phase?"
                    );
                }

                // Return unique suggestions (max 5)
                return [...new Set(suggestions)].slice(0, 5);
            },
        }),
        {
            name: 'fitwizard-wisdom',
        }
    )
);
