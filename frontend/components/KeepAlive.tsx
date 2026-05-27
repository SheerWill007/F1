"use client";

import { useEffect } from "react";
import { startKeepAlive } from "@/utils/keepAlive";

export default function KeepAlive() {
    useEffect(() => {
        startKeepAlive();
    }, []);
    return null;
}