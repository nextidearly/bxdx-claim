"use client";

import React, { useState } from "react";
import Head from "next/head";
import { Container, Nav, Navbar } from "react-bootstrap";
import useWindowSize from "react-use/lib/useWindowSize";
import { MdOutlineSwapCalls } from "react-icons/md";

export default function Airdrop() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const { width, height } = useWindowSize();

  const handleChangeAddress = (address) => {
    if (!address) {
      setChecked(false);
      setAmount(0);
    }
    setAddress(address);
  };

  return (
    <>
      <Head>
        <title>Airdrop</title>
      </Head>
      <div className="main">
        <div className="nav-bar">
          <Navbar>
            <Container className="nav-container">
              <Navbar.Brand href="#home" className="logo">
                <img src="/logo.jpeg" alt="logo image" className="logo" />
              </Navbar.Brand>
              <Nav className="ml-auto">
                <Nav.Link href="https://bxdx.io" className="nav-item me-2">
                  Home
                </Nav.Link>
              </Nav>
            </Container>
          </Navbar>
        </div>

        <div className="gradient"></div>
        <div className="lines">
          <h1 className="bg-text">AIRDROP</h1>
        </div>

        <div className="presale-div">
          <div
            data-augmented-ui="tl-clip tr-clip br-clip bl-clip border inlay"
            className="card-main"
          >
            <div className="w-full flex flex-col gap-[14px] relative">
              <div
                data-augmented-ui="tl-clip tr-clip br-clip bl-clip border inlay"
                className="input-grp w-full"
              >
                <div className="input-head">
                  <span className="input-title">Enter your address</span>
                </div>

                <div className="input-group-inline">
                  <input placeholder="0.0" type="text" />
                </div>
              </div>
              <div
                data-augmented-ui="tl-clip tr-clip br-clip bl-clip border inlay"
                className="input-grp w-full"
              >
                <div className="input-head">
                  <span className="input-title">Enter your address</span>
                </div>

                <div className="input-group-inline">
                  <input placeholder="0.0" type="text" />
                </div>
              </div>

              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black p-2 overflow-hidden h-[40px] w-[40px]"
                data-augmented-ui="tl-clip tr-clip br-clip bl-clip"
              >
                <button className="bg-transparent w-full h-full">
                  <MdOutlineSwapCalls className="text-2xl text-center text-white m-auto" />
                </button>
              </div>
            </div>

            <div className="button-group">
              <button data-augmented-ui="tl-clip tr-clip br-clip bl-clip">
                Exchange
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
