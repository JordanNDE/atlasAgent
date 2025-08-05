import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGetAgentsQuery } from "@/api";
import { BookOpen } from "lucide-react";
import "./App.css";

function Agents() {
    const navigate = useNavigate();
    const { data: agents, isLoading } = useGetAgentsQuery()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
            <div style={{ position: "absolute", top: 24, right: 32 }}>
                <button
                    onClick={() => navigate("/docs")}
                    style={{ display: "flex", alignItems: "center", gap: 8, color: "#00ff38", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 18 }}
                >
                    <BookOpen size={22} style={{ color: "#00ff38" }} />
                    Documentation
                </button>
            </div>
            <h1 className="text-2xl font-bold mb-8">Select an agent:</h1>

            {isLoading ? (
                <div>Loading agents...</div>
            ) : (
                <div className="grid gap-4 w-full max-w-md">
                    {agents?.map((agent) => (
                        <Button
                            key={agent.id}
                            className="w-full text-lg py-6 my-custom-btn"
                            onClick={() => {
                                navigate(`/${agent.id}/chat`);
                            }}
                        >
                            {agent.name}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Agents;
