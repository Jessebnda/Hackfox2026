import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';

import ScreenShell from '@/components/screen-shell';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { geminiGenerateText, getGeminiApiKey } from '@/services/geminiClient';

type ChatbotScreenProps = {
	bottomInset?: number;
	onOpenMap?: () => void;
};

type Message = {
	id: string;
	text: string;
	isUser: boolean;
	timestamp: Date;
	showMapAction?: boolean;
};


const WELCOME_MESSAGE: Message = {
	id: 'welcome',
	text: 'Hola, soy T-bot. Puedo ayudarte a encontrar rutas y puntos de apoyo accesibles.',
	isUser: false,
	timestamp: new Date(),
};

const QUICK_PROMPTS = [
	'Quiero ver el mapa',
	'Necesito una ruta accesible',
	'Buscar puntos seguros',
];

const FOX_SYSTEM_PROMPT = `Eres T-bot, asistente virtual de Hackfox para movilidad accesible en Tijuana.
Responde en español, breve y claro (máximo 3 oraciones).
Ayuda con rutas accesibles, rampas, puntos seguros y uso del mapa de la app.
Si piden mapa o ruta, sugiere abrir el mapa de la app.`;

export default function ChatbotScreen({ bottomInset = 0, onOpenMap }: ChatbotScreenProps) {
	const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
	const [inputText, setInputText] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const [sessionTime] = useState(() => new Date());
	const flatListRef = useRef<FlatList<Message>>(null);
	const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const router = useRouter();
	const { keyboardInset, isKeyboardVisible } = useKeyboardInset(bottomInset);

	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, []);

	const formatTime = (date: Date) =>
		date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

	const pushBotReply = (text: string, showMapAction = false) => {
		setMessages((prev) => [
			...prev,
			{
				id: `${Date.now()}-bot`,
				text,
				isUser: false,
				timestamp: new Date(),
				showMapAction,
			},
		]);
		setIsTyping(false);
	};

	const openMap = () => {
		if (onOpenMap) {
			onOpenMap();
			return;
		}

		router.push('/');
	};

	const replyWithLocalFallback = (content: string, shouldOpenMap: boolean) => {
		const textToLower = content.toLowerCase();

		if (shouldOpenMap) {
			pushBotReply('Te muestro el mapa con los puntos accesibles más cercanos.', true);
			openMap();
			return;
		}

		if (textToLower.includes('hola') || textToLower.includes('buenas')) {
			pushBotReply('Hola. Dime qué necesitas y te ayudo a ubicar rutas y lugares accesibles.');
			return;
		}

		pushBotReply('Puedo revisar opciones en el mapa. Si quieres, pide una ruta accesible o un punto seguro.');
	};

	const handleSend = (messageText?: string) => {
		const content = (messageText ?? inputText).trim();
		if (!content) {
			return;
		}

		setInputText('');
		setMessages((prev) => [
			...prev,
			{
				id: `${Date.now()}-user`,
				text: content,
				isUser: true,
				timestamp: new Date(),
			},
		]);
		setIsTyping(true);

		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		const textToLower = content.toLowerCase();
		const shouldOpenMap =
			textToLower.includes('mapa') ||
			textToLower.includes('ruta') ||
			textToLower.includes('accesible') ||
			textToLower.includes('rampa') ||
			textToLower.includes('segur');

		const run = async () => {
			if (getGeminiApiKey()) {
				try {
					const reply = await geminiGenerateText(content, FOX_SYSTEM_PROMPT);
					pushBotReply(reply, shouldOpenMap);
					if (shouldOpenMap) {
						openMap();
					}
					return;
				} catch {
					// fallback local
				}
			}

			replyWithLocalFallback(content, shouldOpenMap);
		};

		void run();
	};

	const clearConversation = () => {
		setMessages([WELCOME_MESSAGE]);
		setInputText('');
		setIsTyping(false);
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}
	};

	const listFooter = useMemo(() => {
		if (!isTyping) {
			return <View style={{ height: 12 }} />;
		}

		return (
			<View style={[styles.messageRowBot, { marginTop: 4 }]}>
				<View style={styles.botIcon}>
					<ActivityIndicator size="small" color="#e80000" />
				</View>
				<View style={styles.botBubble}>
					<Text style={styles.botText}>Escribiendo...</Text>
				</View>
			</View>
		);
	}, [isTyping]);

	// Scroll to end immediately when keyboard opens to avoid visual gap
	useEffect(() => {
		if (isKeyboardVisible) {
			// small delay to allow layout to adjust
			const id = setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 50);

			return () => clearTimeout(id);
		}
	}, [isKeyboardVisible]);

	return (
		<SafeAreaView style={styles.container}>
			<ScreenShell>
				<KeyboardAvoidingView
					style={styles.keyboardView}
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					keyboardVerticalOffset={bottomInset}
				>
					<View style={styles.header}>
						<Pressable style={styles.newChatButton} onPress={clearConversation}>
							<MaterialCommunityIcons name="restart" size={24} color="#e80000" />
						</Pressable>
					</View>

					<View style={styles.botInfo}>
						<View style={styles.botIconContainer}>
							<MaterialCommunityIcons name="robot" size={40} color="#e80000" />
						</View>
						<View style={styles.botTextContainer}>
							<Text style={styles.botName}>T-bot - <Text style={styles.botRole}>Asistente Virtual</Text></Text>
							<Text style={styles.chatStartTime}>Chat iniciado {formatTime(sessionTime)}</Text>
						</View>
					</View>

					<View style={styles.promptRail}>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptContent}>
							{QUICK_PROMPTS.map((prompt) => (
								<Pressable key={prompt} style={styles.promptChip} onPress={() => handleSend(prompt)}>
									<Text style={styles.promptText}>{prompt}</Text>
								</Pressable>
							))}
						</ScrollView>
					</View>

					<FlatList
						ref={flatListRef}
						data={messages}
						keyExtractor={(item) => item.id}
						contentContainerStyle={[
							styles.messagesList,
							{ paddingBottom: isKeyboardVisible ? keyboardInset + 8 : 18 + bottomInset },
						]}
						renderItem={({ item }) => (
							<View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
								<View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.botBubble]}>
									<Text style={[styles.messageText, item.isUser ? styles.userText : styles.botText]}>
										{item.text}
									</Text>
									{!item.isUser && item.showMapAction && (
										<Pressable style={styles.mapButton} onPress={openMap}>
											<MaterialCommunityIcons name="map-marker" size={18} color="#FFF" />
											<Text style={styles.mapButtonText}>Abrir Mapa</Text>
										</Pressable>
									)}
								</View>
							</View>
						)}
						ListFooterComponent={listFooter}
						keyboardShouldPersistTaps="handled"
						keyboardDismissMode="on-drag"
						onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
						onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
						showsVerticalScrollIndicator={false}
					/>

					<View
						style={[
							styles.inputContainer,
							{ marginBottom: isKeyboardVisible ? 4 : 16 + bottomInset },
						]}
					>
						<TextInput
							style={styles.input}
							placeholder="Escribe aquí..."
							placeholderTextColor="#8b8b8b"
							value={inputText}
							onChangeText={setInputText}
							multiline
							maxLength={500}
						/>
						<Pressable
							style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
							onPress={() => handleSend()}
							disabled={!inputText.trim()}
						>
							<MaterialCommunityIcons
								name="send"
								size={24}
								color={inputText.trim() ? '#fff' : '#c7c7c7'}
							/>
						</Pressable>
					</View>
				</KeyboardAvoidingView>
			</ScreenShell>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f4f4f4',
		paddingHorizontal: 0,
		paddingTop: 0,
	},
	keyboardView: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	newChatButton: {
		padding: 10,
		backgroundColor: '#fff',
		borderRadius: 999,
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.08)',
	},
	botInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 14,
		backgroundColor: '#fff',
		borderRadius: 22,
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.08)',
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 8 },
		elevation: 4,
	},
	botIconContainer: {
		width: 54,
		height: 54,
		borderRadius: 27,
		backgroundColor: 'rgba(232, 0, 0, 0.08)',
		borderWidth: 2,
		borderColor: '#e80000',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	botTextContainer: {
		flex: 1,
	},
	botName: {
		fontSize: 16,
		fontWeight: '700',
		color: '#111',
	},
	botRole: {
		fontWeight: '500',
		color: '#666',
	},
	chatStartTime: {
		fontSize: 13,
		color: '#666',
		marginTop: 6,
	},
	promptRail: {
		marginTop: 12,
		marginBottom: 4,
	},
	promptContent: {
		paddingRight: 12,
		gap: 10,
	},
	promptChip: {
		paddingHorizontal: 14,
		paddingVertical: 10,
		backgroundColor: '#fff',
		borderRadius: 999,
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.08)',
	},
	promptText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#111',
	},
	messagesList: {
		paddingTop: 8,
		paddingBottom: 12,
	},
	messageContainer: {
		marginVertical: 7,
		maxWidth: '84%',
	},
	userMessage: {
		alignSelf: 'flex-end',
	},
	botMessage: {
		alignSelf: 'flex-start',
	},
	messageBubble: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 20,
	},
	userBubble: {
		backgroundColor: '#111',
		borderBottomRightRadius: 4,
	},
	botBubble: {
		backgroundColor: '#fff',
		borderBottomLeftRadius: 4,
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.06)',
		shadowColor: '#000',
		shadowOpacity: 0.06,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
	},
	messageText: {
		fontSize: 15,
		lineHeight: 21,
	},
	userText: {
		color: '#fff',
	},
	botText: {
		color: '#111',
	},
	messageRowUser: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	messageRowBot: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
	},
	botIcon: {
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: '#111',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
		marginTop: 4,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
		backgroundColor: '#fff',
		borderRadius: 20,
		borderWidth: 1,
		borderColor: 'rgba(17, 24, 39, 0.08)',
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 4,
		marginBottom: 16,
	},

	input: {
		flex: 1,
		minHeight: 40,
		maxHeight: 88,
		paddingHorizontal: 12,
		paddingVertical: 9,
		backgroundColor: '#f5f5f5',
		borderRadius: 16,
		fontSize: 15,
		color: '#111',
		marginRight: 10,
	},
	sendButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#e80000',
	},
	sendButtonDisabled: {
		backgroundColor: '#e5e7eb',
	},
	mapButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#e80000',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 16,
		marginTop: 10,
	},
	mapButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '700',
	},
});