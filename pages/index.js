"use client";

import React, { useState } from "react";
import Head from "next/head";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import toast, { Toaster } from "react-hot-toast";
import { Container, Nav, Navbar } from "react-bootstrap";
import { MdOutlineSwapCalls } from "react-icons/md";
import { Box } from "@mui/system";
import { Button, Typography, Stack } from "@mui/material";
import { isMobile } from "mobile-device-detect";
import { getAddress, sendBtcTransaction } from "sats-connect";
import { BsFillCaretDownFill } from "react-icons/bs";
import { TbCurrencySolana } from "react-icons/tb";
import { FaHelicopterSymbol } from "react-icons/fa6";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 300,
  height: 350,
  bgcolor: "white",
  borderRadius: "12px",
  display: "flex",
};

const Mstyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "280px",
  bgcolor: "white",
  borderRadius: "12px",
  boxShadow: 24,
  display: "flex",
};

const mobileWalletStyle = {
  display: "flex",
  gap: "40px",
  alignItems: "start",
  textTransform: "none",
  color: "black",
  justifyContent: "start",
  fontSize: "14px",
  fontWeight: "bold",
};

export default function Home() {
  const [openModal, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [walletAddress, setWalletAddress] = useState(null);
  const [connected, setConnected] = useState(false);
  const [selectedwallet, setSelectedwallet] = useState("unisat");

  const open = Boolean(anchorEl);

  const handleOpen = () => setOpen(true);
  const handleCloseModal = () => setOpen(false);

  const handleClick = (event) => {
    if (connected) {
      setAnchorEl(event.currentTarget);
    } else {
      handleOpen();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getBasicInfo = async () => {
    const unisat = window.unisat;
    const [address] = await unisat.getAccounts();
    setWalletAddress(address);
  };

  const ConnectWallet = async () => {
    try {
      const result = await unisat.requestAccounts();
      handleAccountsChanged(result);
      setConnected(true);
      setOpen(false);
      setSelectedwallet("unisat");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const XverseWalletConnect = async () => {
    try {
      const getAddressOptions = {
        payload: {
          purposes: ["payment"],
          message: "Address for receiving payments",
          network: {
            type: "Mainnet",
          },
        },
        onFinish: (response) => {
          setWalletAddress(response.addresses[0].address);
          setConnected(true);
          setOpen(false);
          setSelectedwallet("xverse");
        },
        onCancel: () => toast.error("Request canceled"),
      };

      await getAddress(getAddressOptions);
    } catch (error) {
      console.log(error);
    }
  };

  const OkxWalletConnect = async () => {
    try {
      if (typeof window.okxwallet === "undefined") {
        toast.error("OKX is not installed!");
      } else {
        const result = await window.okxwallet.bitcoin.connect();
        setWalletAddress(result.address);
        setConnected(true);
        setOpen(false);
        setSelectedwallet("okx");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const LeatherWalletConnect = async () => {
    try {
      if (typeof window.okxwallet === "undefined") {
        toast.error("Leather is not installed!");
      } else {
        const userAddresses = await window.btc?.request("getAddresses");
        const usersNativeSegwitAddress = userAddresses.result.addresses.find(
          (address) => address.type === "p2wpkh"
        );
        setWalletAddress(usersNativeSegwitAddress.address);
        setConnected(true);
        setOpen(false);
        setSelectedwallet("leather");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAccountsChanged = (_accounts) => {
    self.accounts = _accounts;
    if (_accounts.length > 0) {
      setConnected(true);
      getBasicInfo();
    } else {
      setConnected(false);
    }
  };

  const DisconnectWallet = () => {
    setConnected(false);
    handleClose();
  };

  // send BTC
  const depositCoin = async (payAddress, amount, feeRate) => {
    let res;
    try {
      if (selectedwallet === "unisat") {
        res = await depositCoinonUnisat(payAddress, amount, feeRate);
      } else if (selectedwallet === "xverse") {
        res = await depositCoinonXverse(payAddress, amount, feeRate);
      } else if (selectedwallet === "okx") {
        res = await depositCoinonOkx(payAddress, amount, feeRate);
      } else if (selectedwallet === "leather") {
        res = await depositCoinonLeather(payAddress, amount, feeRate);
      }

      if (res) {
        toast.success(
          "Your airdrop is claimed successfully ( check your wallet in 10 ~ 20 minutes )"
        );
      }
    } catch (error) {
      console.log(error);
      toast.error(error.toString());
    }
  };

  const depositCoinonUnisat = async (payAddress, amount, feeRate) => {
    if (walletAddress) {
      try {
        const { txid } = await window.unisat.sendBitcoin(
          payAddress,
          amount,
          feeRate
        );
        return "txid";
      } catch (e) {
        toast.error(e.message);
      }
    } else {
      toast.error("Please connect wallet");
    }
  };

  const depositCoinonXverse = async (payAddress, amount, feeRate) => {
    if (walletAddress) {
      try {
        await sendBtcTransaction({
          payload: {
            network: {
              type: "Mainnet",
            },
            recipients: [
              {
                address: payAddress,
                amountSats: BigInt(amount),
              },
              // you can add more recipients here
            ],
            senderAddress: walletAddress,
          },
          onFinish: (response) => {
            alert(response);
          },
          onCancel: () => alert("Canceled"),
        });
        return "txid";
      } catch (e) {
        console.log(e);
        toast.error(e.message);
      }
    } else {
      toast.error("Please connect wallet");
    }
  };

  const depositCoinonOkx = async (payAddress, amount, feeRate) => {
    try {
      if (walletAddress) {
        const tx = await window.okxwallet.bitcoin.send({
          from: walletAddress,
          to: payAddress,
          value: amount / 10 ** 8,
        });
        // return tx.txhash;
        return "txid";
      } else {
        toast.error("Please connect wallet");
      }
    } catch (error) {
      console.log("depositCoinonOkx", error);
    }
  };

  const depositCoinonLeather = async (payAddress, amount, feeRate) => {
    if (walletAddress) {
      try {
        const resp = await window.btc?.request("sendTransfer", {
          address: payAddress,
          amount: amount,
        });
        // return resp.result.txid;
        return "txid";
      } catch (e) {
        toast.error(e.error.message);
      }
    } else {
      toast.error("Please connect wallet");
    }
  };

  return (
    <>
      <Head>
        <title>Bridge</title>
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
                  DOCS
                </Nav.Link>
                {!connected ? (
                  <div className="button-group">
                    <button
                      data-augmented-ui="tl-clip br-clip border inlay"
                      aria-controls={open ? "basic-menu" : undefined}
                      aria-haspopup="true"
                      className="claim connector"
                      onClick={handleClick}
                    >
                      {isMobile ? "Connect" : "connect"}
                    </button>
                  </div>
                ) : (
                  <div className="button-group">
                    <button
                      data-augmented-ui="tl-clip br-clip border inlay"
                      aria-controls={open ? "basic-menu" : undefined}
                      aria-haspopup="true"
                      onClick={handleClick}
                      className="claim connector"
                      variant="contained"
                    >
                      {walletAddress &&
                        walletAddress.slice(0, 6) +
                          "..." +
                          walletAddress.slice(
                            walletAddress.length - 4,
                            walletAddress.length
                          )}
                    </button>
                  </div>
                )}

                <Menu
                  id="basic-menu"
                  sx={{
                    zIndex: 99999999,
                  }}
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    "aria-labelledby": "basic-button",
                  }}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: "visible",
                      zIndex: 9999999999,
                      position: "fixed",
                      filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                      mt: 1.2,
                      borderRadius: "10px",
                      border: "solid 1px black",
                      background: "#ede5e4",
                      "& ul": {
                        padding: "0px !important",
                        backgroundColor: "#ede5e4",
                        borderRadius: "11px",
                      },
                      "& .MuiAvatar-root": {
                        width: 65,
                        height: 32,
                        ml: 0,
                        mr: 1,
                      },
                      "&:before": {
                        content: '""',
                        display: "block",
                        position: "absolute",
                        border: "solid 1px black",
                        top: 0,
                        right: 14,
                        backgroundColor: "#ede5e4",
                        width: 10,
                        height: 10,
                        transform: "translateY(-50%) rotate(45deg)",
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  <MenuItem
                    onClick={handleClose}
                    sx={{ fontSize: "15px", fontWeight: "bold" }}
                  >
                    {walletAddress ? (
                      walletAddress.slice(0, 6) +
                      "..." +
                      walletAddress.slice(
                        walletAddress.length - 4,
                        walletAddress.length
                      )
                    ) : (
                      <></>
                    )}
                  </MenuItem>
                  <MenuItem
                    onClick={DisconnectWallet}
                    sx={{ fontSize: "15px", fontWeight: "bold" }}
                  >
                    Disconnect
                  </MenuItem>
                </Menu>
              </Nav>
            </Container>
          </Navbar>
        </div>

        <div className="gradient"></div>
        <div className="lines flex justify-center">
          <h1 className="bg-text text-center">BRIDGE</h1>
        </div>

        <div className="presale-div">
          <div
            data-augmented-ui="tl-clip tr-clip br-clip bl-clip border inlay"
            className="card-main"
          >
            <div className="w-full flex flex-col gap-[14px] relative">
              <div
                data-augmented-ui="tl-clip tr-clip br-clip bl-clip border inlay"
                className="input-grp w-full flex"
              >
                <div>
                  <div className="input-head p-0">
                    <span className="input-title text-sm p-0">You send</span>
                  </div>
                  <div className="input-group-inline">
                    <input placeholder="0.0" type="text" />
                  </div>
                </div>

                <button
                  data-augmented-ui="tl-clip tr-clip br-clip bl-clip"
                  className="claim bg-black text-white max-w-[120px] font-semibold flex w-fit gap-2 justify-between items-center px-2.5"
                >
                 <img src="/tr-logo.png"  alt="logo" className="w-[30px] h-[30px]"/>
                  Bitx
                  <BsFillCaretDownFill />
                </button>
              </div>
              <div
                data-augmented-ui="tl-clip tr-clip br-clip bl-clip border inlay"
                className="input-grp w-full flex"
              >
                <div>
                  <div className="input-head p-0">
                    <span className="input-title text-sm p-0">You get</span>
                  </div>
                  <div className="input-group-inline">
                    <input placeholder="0.0" type="text" />
                  </div>
                </div>

                <button
                  data-augmented-ui="tl-clip tr-clip br-clip bl-clip"
                  className="claim bg-black text-white max-w-[120px] font-semibold flex w-fit gap-2 justify-between items-center px-2.5"
                >
                  <TbCurrencySolana className="text-3xl" />
                  SOL
                  <BsFillCaretDownFill />
                </button>
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

      <Modal
        open={openModal}
        className="modal-index"
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        {isMobile ? (
          <Box sx={Mstyle}>
            <Stack
              sx={{
                flex: "1",
                bgcolor: "#d3d3d3",
                borderRadius: "12px",
                px: 5,
                py: 4,
              }}
            >
              <Button sx={mobileWalletStyle} onClick={ConnectWallet}>
                <img
                  src={"/assets/wallet/unisat.jpg"}
                  alt=""
                  width={30}
                  height={30}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                  }}
                />{" "}
                <Box>Unisat Wallet</Box>
              </Button>

              <Button onClick={XverseWalletConnect} sx={mobileWalletStyle}>
                <img
                  src={"/assets/wallet/xverse.jpg"}
                  alt=""
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                  }}
                />{" "}
                <Box>Xverse Wallet</Box>
              </Button>

              <Button onClick={OkxWalletConnect} sx={mobileWalletStyle}>
                <img
                  src={"/assets/wallet/okx.png"}
                  alt=""
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                  }}
                />{" "}
                <Box>Okx Wallet</Box>
              </Button>

              <Button onClick={LeatherWalletConnect} sx={mobileWalletStyle}>
                <img
                  src={"/assets/wallet/leather.jpg"}
                  alt=""
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                  }}
                />{" "}
                <Box>Leather Wallet</Box>
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box sx={style}>
            <Stack
              sx={{
                flex: "1",
                bgcolor: "#d3d3d3",
                borderRadius: "12px",
                p: 4,
              }}
            >
              <Typography
                id="modal-modal-title"
                variant="h6"
                component="h2"
                mb={5}
              >
                Connect a Wallet
              </Typography>
              <Button
                sx={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  textTransform: "none",
                  color: "black",
                  justifyContent: "flex-start",
                }}
                onClick={ConnectWallet}
              >
                <img
                  src={"/assets/wallet/unisat.jpg"}
                  width={30}
                  height={30}
                  alt=""
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                  }}
                />{" "}
                Unisat Wallet
              </Button>
              <Button
                onClick={XverseWalletConnect}
                sx={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  textTransform: "none",
                  color: "black",
                  justifyContent: "flex-start",
                }}
              >
                <img
                  alt=""
                  src={"/assets/wallet/xverse.jpg"}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                  }}
                />{" "}
                Xverse Wallet
              </Button>
              <Button
                onClick={OkxWalletConnect}
                sx={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  textTransform: "none",
                  color: "black",
                  justifyContent: "flex-start",
                }}
              >
                <img
                  alt=""
                  src={"/assets/wallet/okx.png"}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                  }}
                />{" "}
                Okx Wallet
              </Button>
              <Button
                onClick={LeatherWalletConnect}
                sx={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  textTransform: "none",
                  color: "black",
                  justifyContent: "flex-start",
                }}
              >
                <img
                  src={"/assets/wallet/leather.jpg"}
                  alt=""
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                  }}
                />{" "}
                Leather Wallet
              </Button>
            </Stack>
          </Box>
        )}
      </Modal>

      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          className: "",
          duration: 5000,
          style: {
            background: "black",
            color: "#fff",
          },
          success: {
            duration: 3000,
            theme: {
              primary: "green",
              secondary: "black",
            },
          },
        }}
      />
    </>
  );
}
