"use client";

import { useEffect } from "react";
import { startKeepAlive } from "@/utlis/keepAlive";

export default function KeepAlive() {
    useEffect(() => {
        startKeepAlive();
    }, []);
    return null;
}