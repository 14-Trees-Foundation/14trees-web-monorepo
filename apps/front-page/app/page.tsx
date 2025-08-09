import ChatBot from "components/Chatbot/ChatBot";
import ChatbotV2 from "components/Chatbot/ChatBotV2";
import { HomePage } from "components/Partials/HomePage";
import { Metadata } from "next";
import labels from "~/assets/labels.json";

export const metadata: Metadata = {
  title: labels.site.title,
  description: labels.site.description,
};

const Home = () => {
  return (
    <>
      <HomePage />
      <ChatBot />
      <ChatbotV2 />
    </>
  );
}

export default Home;
