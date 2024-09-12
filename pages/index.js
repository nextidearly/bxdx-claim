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
import {
  getAddress,
  sendBtcTransaction,
  signMessage,
  Wallet,
  AddressPurpose,
  BitcoinNetworkType,
} from "sats-connect";
import { BsFillCaretDownFill } from "react-icons/bs";
import { TbCurrencySolana } from "react-icons/tb";
import bitcoin from "bitcoinjs-message";
import { verifyMessage } from "@unisat/wallet-utils";
import {
  ref,
  query,
  orderByChild,
  equalTo,
  update,
  remove,
  get,
  push,
} from "firebase/database";
import { db } from "@/services/firebase";
import { addressData } from "@/constants/address";
import { FaBitcoin } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import { useWallets, useWallet } from "@wallet-standard/react";

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
  const [ogAddress, setOGAddress] = useState(null);
  // const [walletAddress, setWalletAddress] = useState(null);
  const [connected, setConnected] = useState(false);
  const [selectedwallet, setSelectedwallet] = useState("unisat");
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState();
  const [ogData, setOGData] = useState();

  const [solAddress, setSolAddress] = useState("");
  const open = Boolean(anchorEl);

  const SatsConnectNamespace = "sats-connect:";

  function isSatsConnectCompatibleWallet(wallet) {
    return SatsConnectNamespace in wallet.features;
  }

  const { wallets } = useWallets();
  const { setWallet } = useWallet();

  const filteredwallets = wallets.filter(isSatsConnectCompatibleWallet);
  const magicedenWallet = filteredwallets.filter(
    (wallet) => wallet.name == "Magic Eden"
  );

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

  // Helper function to sleep for a specified duration
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function fetchAllData(address) {
    const baseUrl = "/tracker/priapi/v1/nft/personal/owned/collection-list";
    let allData = [];
    let pageNo = 1;
    let pageSize = 20; // Define page size as constant, since it's reused

    while (true) {
      const tParam = Date.now();
      const url = `${baseUrl}?t=${tParam}`;

      try {
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            address: address,
            chain: 0,
            pageNo: pageNo,
            pageSize: pageSize,
            hiddenStatus: "",
            projectCertificated: false,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const result = await res.json();
        allData = allData.concat(result.data.list);

        // Using the total and current fetched count to determine if there are more pages
        const fetchedItemsCount = pageNo * pageSize;
        if (fetchedItemsCount >= result.data.total) {
          // No more data to fetch, break out of the loop
          break;
        }

        pageNo++;

        // Sleep only if there is more data to fetch
        await sleep(200);
      } catch (error) {
        console.error("Error fetching data:", error);
        break; // Exit if there is an error
      }
    }

    console.log(`Fetched ${allData.length} items.`);
    return allData;
  }

  const checkEligibility = async (address) => {
    const data = await fetchAllData(address);
    const eligibleCollection = data.find(
      (collection) => collection.collectionName === "bitx-runes"
    );
    setOGData(eligibleCollection ? eligibleCollection.count : 0);
    return eligibleCollection ? eligibleCollection.count : 0;
  };

  const verifyAddress = async (address) => {
    const filtered = addressData.filter((data) => data.address == address);
    return filtered;
  };

  const RegisterAddress = async () => {
    const dbRef = ref(db, "BTCPresale");
    const dbRefOG = ref(db, "BTCOGPresale");

    if (data.length) {
      setLoading(true);
      const dbQuery = query(
        dbRef,
        orderByChild("btcAddress"),
        equalTo(walletAddress)
      );

      const snapshot = await get(dbQuery);
      const exist = snapshot.val();

      if (exist) {
        const key = Object.keys(exist)[0];
        const dbRefUpdate = ref(db, `BTCPresale/${key}`);
        await update(dbRefUpdate, {
          value: data[0].value,
          btcAddress: data[0].address,
          solAddress: solAddress,
        });
        toast.success("Your airdrop data is updated successfully.");
      } else {
        const dbRef = ref(db, `BTCPresale`);
        await push(dbRef, {
          value: data[0].value,
          btcAddress: data[0].address,
          solAddress: solAddress,
        });
        toast.success("Your address is registered successfully.");
      }
    }

    if (ogData && ogAddress) {
      setLoading(true);
      const dbQuery = query(
        dbRefOG,
        orderByChild("btcAddress"),
        equalTo(ogAddress)
      );

      const snapshot = await get(dbQuery);
      const exist = snapshot.val();

      if (exist) {
        const key = Object.keys(exist)[0];
        const dbRefUpdate = ref(db, `BTCOGPresale/${key}`);
        await update(dbRefUpdate, {
          value: ogData * 500,
          btcAddress: ogAddress,
          solAddress: solAddress,
        });
        toast.success("Your airdrop data for og pass is updated successfully.");
      } else {
        const dbRef = ref(db, `BTCOGPresale`);
        await push(dbRef, {
          value: ogData * 500,
          btcAddress: ogAddress,
          solAddress: solAddress,
        });
        toast.success("Your og pass address is registered successfully.");
      }
    }
    setLoading(false);
  };

  const getBasicInfo = async () => {
    const unisat = window.unisat;
    const [address] = await unisat.getAccounts();
    setWalletAddress(address);
    setOGAddress(address);
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
          purposes: ["payment", "ordinals"],
          message: "Address for receiving payments",
          network: {
            type: "Mainnet",
          },
        },
        onFinish: (response) => {
          setWalletAddress(response.addresses[0].address);
          setOGAddress(response.addresses[1].address);
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
        setOGAddress(result.address);
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
        const usersOGAddress = userAddresses.result.addresses.find(
          (address) => address.type === "p2tr"
        );
        setWalletAddress(usersNativeSegwitAddress.address);
        setOGAddress(usersOGAddress.address);
        setConnected(true);
        setOpen(false);
        setSelectedwallet("leather");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const MagicEdenWalletConnect = async () => {
    if (magicedenWallet[0]) {
      try {
        await getAddress({
          getProvider: async () =>
            magicedenWallet[0].features[SatsConnectNamespace]?.provider,
          payload: {
            purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
            message: "Address for receiving Ordinals and payments",
            network: {
              type: BitcoinNetworkType.Mainnet,
            },
          },
          onFinish: (response) => {
            setWallet(magicedenWallet[0]);
            setWalletAddress(response.addresses[0].address);
            setOGAddress(response.addresses[1].address);
            setConnected(true);
            setOpen(false);
            setSelectedwallet("magiceden");
          },
          onCancel: () => {
            toast.error("Request canceled");
          },
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      toast.error("Please install wallet");
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
    setOGData();
    setData();
    setConnected(false);
    handleClose();
    setWalletAddress(null);
    setOGAddress(null);
  };

  // send BTC
  const handleSign = async (payAddress, amount, feeRate) => {
    setLoading(true);
    try {
      if (selectedwallet === "unisat") {
        await depositCoinonUnisat(payAddress, amount, feeRate);
      } else if (selectedwallet === "xverse") {
        await depositCoinonXverse(payAddress, amount, feeRate);
      } else if (selectedwallet === "okx") {
        await depositCoinonOkx(payAddress, amount, feeRate);
      } else if (selectedwallet === "leather") {
        await depositCoinonLeather(payAddress, amount, feeRate);
      } else if (selectedwallet === "magiceden") {
        await depositCoinonMagic(payAddress, amount, feeRate);
      }
    } catch (error) {
      setLoading(false);
    }

    setLoading(false);
  };

  const depositCoinonUnisat = async () => {
    // let publicKey = await window.unisat.getPublicKey();
    // let res = await window.unisat.signMessage(solAddress);
    // verifyMessage(publicKey, solAddress, res);
    const ogres = await checkEligibility(ogAddress);
    const res = await verifyAddress(walletAddress);
    if (res.length) {
      setData(res);
    }

    if (!ogres && !res.length) {
      toast.error("Your address is not registered");
    }
  };

  const depositCoinonXverse = async () => {
    if (walletAddress) {
      // verifyMessage(publicKey, solAddress, res);
      const ogres = await checkEligibility(ogAddress);
      const res = await verifyAddress(walletAddress);
      if (res.length) {
        setData(res);
      }

      if (!ogres && !res.length) {
        toast.error("Your address is not registered");
      } else {
        toast.success(
          "You can get airdrop. Please register your sol address to airdrop list"
        );
      }
    } else {
      toast.error("Please connect wallet");
    }
  };

  const depositCoinonOkx = async (payAddress, amount, feeRate) => {
    try {
      // verifyMessage(publicKey, solAddress, res);
      const ogres = await checkEligibility(ogAddress);
      const res = await verifyAddress(walletAddress);
      if (res.length) {
        setData(res);
      }

      if (!ogres && !res.length) {
        toast.error("Your address is not registered");
      } else {
        toast.success(
          "You can get airdrop. Please register your sol address to airdrop list"
        );
      }
    } catch (error) {
      console.log("depositCoinonOkx", error);
    }
  };

  const depositCoinonLeather = async (payAddress, amount, feeRate) => {
    if (walletAddress) {
      // verifyMessage(publicKey, solAddress, res);
      const ogres = await checkEligibility(ogAddress);
      const res = await verifyAddress(walletAddress);
      if (res.length) {
        setData(res);
      }

      if (!ogres && !res.length) {
        toast.error("Your address is not registered");
      } else {
        toast.success(
          "You can get airdrop. Please register your sol address to airdrop list"
        );
      }
    } else {
      toast.error("Please connect wallet");
    }
  };

  const depositCoinonMagic = async (payAddress, amount, feeRate) => {
    if (walletAddress) {
      // verifyMessage(publicKey, solAddress, res);
      const ogres = await checkEligibility(ogAddress);
      const res = await verifyAddress(walletAddress);
      if (res.length) {
        setData(res);
      }

      if (!ogres && !res.length) {
        toast.error("Your address is not registered");
      } else {
        toast.success(
          "You can get airdrop. Please register your sol address to airdrop list"
        );
      }
    } else {
      toast.error("Please connect wallet");
    }
    depositCoinonMagic;
  };

  return (
    <>
      <Head>
        <title>Airdrop BTC TO SOL</title>
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
          <h1 className="bg-text text-center">-CLAIM-</h1>
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
                <div className="w-full">
                  <div className="input-head p-0">
                    <span className="input-title text-sm p-0">
                      Input solana address to get airdrop
                    </span>
                  </div>
                  <div className="input-group-inline mt-2 text-sm">
                    <input
                      placeholder="5P3mxk..."
                      type="text"
                      className="w-full"
                      onChange={(e) => {
                        setSolAddress(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {data && (
              <div
                div
                className="text-white text-start w-full p-2 rounded-md bg-green-500/20 cs-border"
              >
                <div className="text-white text-center text-sm rounded-md flex gap-1 items-center justify-center">
                  You deposited{" "}
                  <span className="font-semibold">
                    {data[0].value / 10 ** 8}
                  </span>{" "}
                  <FaBitcoin />
                </div>
                <div className="text-white text-center rounded-md flex gap-1 items-center text-sm">
                  Please Register your address to get Airdrop Bitx SPL token.
                </div>
              </div>
            )}

            {ogData ? (
              <div
                div
                className="text-white text-start w-full p-2 rounded-md bg-green-500/20 cs-border"
              >
                <div className="text-white text-center text-sm rounded-md flex gap-1 items-center justify-center">
                  You hold{" "}
                  <span className="font-semibold">{ogData} og pass</span> ({" "}
                  {ogData} * 500 = {ogData * 500}{" "}
                  <span className="text-[11px] text-gray-200">Bitx</span> )
                </div>
                <div className="text-white text-center rounded-md flex gap-1 items-center text-sm">
                  Please Register your address to get Airdrop Bitx SPL token.
                </div>
              </div>
            ) : (
              ""
            )}

            {data || ogData? (
              <div className="button-group">
                {loading ? (
                  <button
                    data-augmented-ui="tl-clip tr-clip br-clip bl-clip"
                    className="flex justify-center items-center"
                  >
                    <ImSpinner8 className="animate-spin text-xl" />
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      RegisterAddress();
                    }}
                    data-augmented-ui="tl-clip tr-clip br-clip bl-clip"
                  >
                    Register
                  </button>
                )}
              </div>
            ) : (
              <div className="button-group">
                {loading ? (
                  <button
                    className="flex justify-center items-center"
                    data-augmented-ui="tl-clip tr-clip br-clip bl-clip"
                  >
                    <ImSpinner8 className="animate-spin text-xl" />
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (!walletAddress) {
                        toast.error(
                          "Please connect your BTC wallet to verify if you are presaler"
                        );
                        return;
                      }
                      if (!solAddress) {
                        toast.error("Please input your solana address");
                        return;
                      }
                      handleSign();
                    }}
                    data-augmented-ui="tl-clip tr-clip br-clip bl-clip"
                  >
                    Verify Wallet
                  </button>
                )}
              </div>
            )}
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
              <Button onClick={MagicEdenWalletConnect} sx={mobileWalletStyle}>
                <img
                  src={"/assets/wallet/magiceden.png"}
                  alt=""
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                  }}
                />{" "}
                <Box>magiceden Wallet</Box>
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
              <Button
                onClick={MagicEdenWalletConnect}
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
                  src={"/assets/wallet/magiceden.png"}
                  alt=""
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "5px",
                  }}
                />{" "}
                Magiceden Wallet
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
