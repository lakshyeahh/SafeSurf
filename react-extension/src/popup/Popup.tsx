"use client"
import React from "react"
import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AlertTriangle, ChevronDown, Globe, Settings, Shield, X, Info, CheckCircle, XCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import axios from 'axios';

interface InfoItemProps {
  label: string
  value: string | number
  isGood: boolean
  tooltip: string
}

interface SiteData {
  status: string;
  url: string;
  response_status: number;
  rank: number;
  age: string;
  whois: WhoisInfo;
  is_url_shortened: number;
  hsts_support: number;
  ip_present: number;
  url_redirects: number;
  too_long_url: number;
  too_deep_url: number;
  ip: string;
  ssl: SslInfo;
  trust_score: number;
}

interface WhoisInfo {
  "Domain Name": string;
  Registrar: string;
  "Whois Server": string;
  "Referral Url": string | null;
  "Updated Date": string;
  "Creation Date": string;
  "Expiration Date": string;
  "Name Servers": string;
  Status: string;
  Emails: string;
  Dnssec: string;
  Name: string;
  Org: string;
  Address: string;
  City: string;
  State: string;
  "Registrant Postal Code": string;
  Country: string;
}

interface SslInfo {
  "Issued By": string;
  "Issued To": string;
  "Valid From": string;
  "Valid Till": string;
  "Days to Expiry": number;
  Version: string;
  "Is Certificate Revoked": boolean;
  "Cipher Suite": string;
}


const InfoItem: React.FC<InfoItemProps> = ({ label, value, isGood, tooltip }) => (
  <div className="flex items-center justify-between py-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center">
          <span className="text-xs mr-1">{label}:</span>
          <Info className="w-3 h-3 text-blue-400" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <div className="flex items-center">
      <span className="text-xs mr-1">{value}</span>
      {isGood ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
    </div>
  </div>
)

export default function Popup() {
  const [activeTab, setActiveTab] = useState("overview")
  const [siteData, setSiteData] = useState<SiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [urlSC, setUrlSC] = useState<string | undefined>(undefined); // State to store the input URL


  useEffect(() => {
    const loadData = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          setUrlSC(tab.url);
        } else {
          console.error("Unable to retrieve the active tab's URL.");
        }
      } catch (error) {
        console.error("Error retrieving tab URL:", error);
      }
    };

    loadData(); // Call the async function within useEffect
  }, []); // Empty dependency array ensures this only runs once on mount

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const url = tab?.url

        if (!url) {
          setError("Failed to retrieve the current tab's URL.")
          setLoading(false)
          return
        }

        const response = await fetch("http://localhost:5000/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) throw new Error("Failed to fetch data from the server.")
        const data = await response.json()
        if (data.status === "SUCCESS") {
          setSiteData(data.output)
        } else {
          setError(data.msg || "Analysis failed")
        }
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to analyze the URL.")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <div className="text-white p-4">Loading...</div>
  if (error) return <div className="text-red-500 p-4">{error}</div>
  if (!siteData) return <div className="text-white p-4">No data available</div>




  const openSourceCodeTab = async () => {
    try {
      const response = await fetch("http://localhost:5000/source-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlSC })
      });
      const data = await response.json();
      if (data.status === "SUCCESS") {
        const newTab = window.open();
        newTab!.document.write("<pre>" + data.formatted_html + "</pre>"); // Pre-formatted HTML
      } else {
        alert(data.msg || "Error fetching source code.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getTrustLabel = (score: number) => {
    if (score >= 80) return "Safe"
    if (score >= 50) return "Caution"
    return "Dangerous"
  }

  const getTrustColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  const reportPhishingSite = async () => {
    try {
      // Fetch the current page URL
      const siteUrl = window.location.href;
  
      // Send the POST request with the site URL marked as phishing
      const response = await axios.post('/update-db', {
        site: siteUrl,
        status: 'phishing'
      });
  
      // Alert user based on response
      if (response.status === 200) {
        alert('Website reported successfully!');
      } else {
        alert('Failed to report the website.');
      }
    } catch (error) {
      // Handle errors gracefully
    
    }
  };
  


  return (
    <div className="w-[400px] text-white p-4 rounded-lg shadow-lg bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex items-center justify-between mb-4 bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
        <div className="flex items-center space-x-2">
          <Globe className="w-6 h-6" />
          <h1 className="text-lg font-bold">{siteData.whois["Domain Name"]}</h1>
        </div>
        <div className={`w-16 h-2 rounded-full ${siteData.trust_score}`} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-5 bg-black bg-opacity-30 rounded-lg shadow-md">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-white data-[state=active]:bg-opacity-20 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="general" className="text-xs data-[state=active]:bg-white data-[state=active]:bg-opacity-20 data-[state=active]:text-white">
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs data-[state=active]:bg-white data-[state=active]:bg-opacity-20 data-[state=active]:text-white">
            Security
          </TabsTrigger>
          <TabsTrigger value="technical" className="text-xs data-[state=active]:bg-white data-[state=active]:bg-opacity-20 data-[state=active]:text-white">
            Technical
          </TabsTrigger>
          <TabsTrigger value="whois" className="text-xs data-[state=active]:bg-white data-[state=active]:bg-opacity-20 data-[state=active]:text-white">
            WHOIS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="p-3 rounded-lg bg-black bg-opacity-30 shadow-md">
            <p className="text-sm font-medium mb-2">Trust Score</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`text-3xl font-bold ${getTrustColor(siteData.trust_score)} bg-opacity-20 px-2 py-1 rounded`}>
                  {siteData.trust_score}
                </span>
                <span className="text-lg">{getTrustLabel(siteData.trust_score)}</span>
              </div>
              <div className="w-12 h-12">
                {siteData.trust_score >= 80 ? (
                  <Shield className="w-full h-full text-green-500" />
                ) : siteData.trust_score >= 50 ? (
                  <AlertTriangle className="w-full h-full text-yellow-500" />
                ) : (
                  <X className="w-full h-full text-red-500" />
                )}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black bg-opacity-30 shadow-md">
            <InfoItem
              label="SSL Status"
              value={siteData.ssl["Days to Expiry"] > 0 ? "Valid" : "Invalid"}
              isGood={siteData.ssl["Days to Expiry"] > 0}
              tooltip="A valid SSL certificate ensures secure communication."
            />
            <InfoItem
              label="Domain Age"
              value={siteData.age}
              isGood={parseFloat(siteData.age) > 1}
              tooltip="Older domains are generally more trustworthy."
            />
            <InfoItem
              label="HSTS Support"
              value={siteData.hsts_support === 1 ? "Yes" : "No"}
              isGood={siteData.hsts_support === 1}
              tooltip="HSTS ensures only secure connections are used."
            />
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between w-full bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
              <span className="font-medium text-sm">General Information</span>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-3 bg-black bg-opacity-30 rounded-lg shadow-md">
              <InfoItem
                label="Domain Age"
                value={siteData.age}
                isGood={parseFloat(siteData.age) > 1}
                tooltip="Older domains are generally more trustworthy."
              />
              <InfoItem
                label="Global Rank"
                value={siteData.rank.toLocaleString()}
                isGood={siteData.rank < 1000000}
                tooltip="A higher rank suggests better popularity and trustworthiness."
              />
              <InfoItem
                label="URL Redirects"
                value={siteData.url_redirects === 0 ? "No" : "Yes"}
                isGood={siteData.url_redirects === 0}
                tooltip="Redirects may hide the true destination, potentially indicating phishing attempts."
              />
              <InfoItem
                label="Too Long URL"
                value={siteData.too_long_url === 0 ? "No" : "Yes"}
                isGood={siteData.too_long_url === 0}
                tooltip="Long URLs can sometimes be used to disguise malicious links."
              />
              <InfoItem
                label="Too Deep URL"
                value={siteData.too_deep_url === 0 ? "No" : "Yes"}
                isGood={siteData.too_deep_url === 0}
                tooltip="Overly complex URLs can be a sign of phishing."
              />
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>


        <TabsContent value="security" className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between w-full bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
              <span className="font-medium text-sm">Security Details</span>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-3 bg-black bg-opacity-30 rounded-lg shadow-md">
              <InfoItem
                label="HTTP Status"
                value={siteData.response_status}
                isGood={siteData.response_status === 200}
                tooltip="A status of 200 indicates that the site is accessible."
              />
              <InfoItem
                label="HSTS Support"
                value={siteData.hsts_support === 1 ? "Yes" : "No"}
                isGood={siteData.hsts_support === 1}
                tooltip="HSTS ensures only secure connections are used."
              />
              <InfoItem
                label="URL Shortener"
                value={siteData.is_url_shortened === 1 ? "Yes" : "No"}
                isGood={siteData.is_url_shortened === 0}
                tooltip="Shortened URLs may obscure the true destination and can be risky."
              />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="flex justify-between w-full bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
              <span className="font-medium text-sm">SSL Certificate Details</span>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-3 bg-black bg-opacity-30 rounded-lg shadow-md">
              <InfoItem
                label="Valid"
                value={siteData.ssl["Days to Expiry"] > 0 ? "Yes" : "No"}
                isGood={siteData.ssl["Days to Expiry"] > 0}
                tooltip="A valid SSL certificate ensures secure communication."
              />
              <InfoItem
                label="Issuer"
                value={siteData.ssl["Issued By"]}
                isGood={true}
                tooltip="The authority that issued the SSL certificate."
              />
              <InfoItem
                label="Days to Expiry"
                value={siteData.ssl["Days to Expiry"]}
                isGood={siteData.ssl["Days to Expiry"] > 30}
                tooltip="Certificates close to expiry may be a risk if not renewed."
              />
              <InfoItem
                label="Revoked"
                value={siteData.ssl["Is Certificate Revoked"] ? "Yes" : "No"}
                isGood={!siteData.ssl["Is Certificate Revoked"]}
                tooltip="A revoked SSL certificate may indicate a security issue."
              />
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>


        <TabsContent value="technical" className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between w-full bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
              <span className="font-medium text-sm">Technical Details</span>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-3 bg-black bg-opacity-30 rounded-lg shadow-md">
              <InfoItem
                label="IP of Domain"
                value={siteData.ip}
                isGood={true}
                tooltip="The IP address associated with the domain, used for network routing."
              />
              <InfoItem
                label="IP in URL"
                value={siteData.ip_present === 0 ? "No" : "Yes"}
                isGood={siteData.ip_present === 0}
                tooltip="Using an IP address instead of a domain can be a phishing tactic."
              />
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        <TabsContent value="whois" className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between w-full bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
              <span className="font-medium text-sm">WHOIS Information</span>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-3 bg-black bg-opacity-30 rounded-lg shadow-md">
              <InfoItem
                label="Registrar"
                value={siteData.whois.Registrar}
                isGood={true}
                tooltip="The company that registered the domain name."
              />
              <InfoItem
                label="Creation Date"
                value={new Date(siteData.whois["Creation Date"]).toLocaleDateString()}
                isGood={true}
                tooltip="When the domain was first registered."
              />
              <InfoItem
                label="Expiration Date"
                value={new Date(siteData.whois["Expiration Date"]).toLocaleDateString()}
                isGood={new Date(siteData.whois["Expiration Date"]) > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                tooltip="When the domain registration will expire. Should be well in the future."
              />
              <p className="text-xs mt-2 font-medium">Name Servers:</p>
              <ul className="list-disc list-inside pl-2">
                {siteData.whois["Name Servers"].split(',').map((server, index) => (
                  <li key={index} className="text-xs py-1">{server.trim()}</li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

      </Tabs>

      <div className="flex justify-between items-center mt-4 bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-white hover:text-white hover:bg-white hover:bg-opacity-10 mt-2"
          onClick={openSourceCodeTab}
        >
          <Settings className="w-4 h-4 mr-1" />
          Source Code
        </Button>
        <Button
          variant="link"
          size="sm"
          className="text-xs text-white hover:text-gray-300 mt-2"
          onClick={openSourceCodeTab}
        >
          View Report
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-white bg-red-500 hover:bg-red-600 mt-2"
          onClick={reportPhishingSite}  // Trigger the report function directly
        >
          Report This Website
        </Button>
      </div>
    </div>
  )
}
