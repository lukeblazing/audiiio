import React, { useCallback, useEffect, useRef, useState } from 'react';
import AppNavbar from '../dashboard/AppNavbar';
import {
    Box,
    Toolbar,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    FormControl,
    MenuItem,
    Select,
    Tooltip,
} from '@mui/material';
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    StrikethroughS,
    FormatListBulleted,
    FormatListNumbered,
    Save as SaveIcon,
    TextFields as FontSizeIcon,
} from '@mui/icons-material';

const FONT_SIZES = [
    { label: 'S', value: '12px' },
    { label: 'M', value: '16px' },
    { label: 'L', value: '20px' },
    { label: 'XL', value: '24px' },
];

const FONT_FAMILIES = [
    'Courier New', // Default
    'serif',
    'sans-serif',
    'monospace',
    'Georgia',
    'Times New Roman',
];

function saveNotes(noteContent) {
    console.log("SAVE NOTE:");
    console.log(noteContent);
}

export default function NotesPage() {
    const editorRef = useRef(null);
    const [formatSel, setFormatSel] = useState([]);
    const [listSel, setListSel] = useState(null);
    const [fontSize, setFontSize] = useState('16px');
    const [fontFamily, setFontFamily] = useState('Courier New');

    const exec = (command, value = null) => {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const toggleFormat = (fmt) => {
        const command = {
            bold: 'bold',
            italic: 'italic',
            underline: 'underline',
            strike: 'strikeThrough',
        }[fmt];
        exec(command);
        setFormatSel((prev) =>
            prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
        );
    };

    const toggleList = (next) => {
        if (!next) {
            exec('insertParagraph');
            setListSel(null);
            return;
        }
        exec(next === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
        setListSel(next);
    };

    const handleFontSize = (e) => {
        const val = e.target.value;
        setFontSize(val);
        exec('fontSize', 7); // max size
        document.queryCommandValue('fontSize');
        document.getSelection()?.anchorNode?.parentNode?.style?.setProperty(
            'font-size',
            val
        );
    };

    const handleFontFamily = (e) => {
        const val = e.target.value;
        setFontFamily(val);
        exec('fontName', val);
    };

    const handleSave = () => {
        if (editorRef.current) saveNotes(editorRef.current.innerHTML);
    };

    const keyHandler = useCallback((e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            exec('insertText', '\u00a0\u00a0\u00a0\u00a0');
        }
    }, []);

    useEffect(() => {
        const node = editorRef.current;
        node?.addEventListener('keydown', keyHandler);
        return () => node?.removeEventListener('keydown', keyHandler);
    }, [keyHandler]);

    return (
    <>
            <AppNavbar />
            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    overflowY: 'visible',
                    paddingTop: 'calc(102px + env(safe-area-inset-top))',
                }}
            >
                <Box
                    sx={{
                        width: '90vw',
                        height: '80vh',
                        bgcolor: 'background.paper',
                    }}
                >
                    <Toolbar
                        variant="dense"
                        sx={{
                            gap: 1,
                            borderBottom: 1,
                            borderColor: 'divider',
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* Inline styles */}
                        <ToggleButtonGroup
                            size="small"
                            value={formatSel}
                            aria-label="text formatting"
                        >
                            <ToggleButton value="bold" onClick={() => toggleFormat('bold')}>
                                <FormatBold />
                            </ToggleButton>
                            <ToggleButton value="italic" onClick={() => toggleFormat('italic')}>
                                <FormatItalic />
                            </ToggleButton>
                            <ToggleButton value="underline" onClick={() => toggleFormat('underline')}>
                                <FormatUnderlined />
                            </ToggleButton>
                            <ToggleButton value="strike" onClick={() => toggleFormat('strike')}>
                                <StrikethroughS />
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {/* Lists (mutually exclusive) */}
                        <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={listSel}
                            onChange={(_, next) => toggleList(next)}
                            aria-label="list style"
                            sx={{ ml: 1 }}
                        >
                            <ToggleButton value="ul">
                                <FormatListBulleted />
                            </ToggleButton>
                            <ToggleButton value="ol">
                                <FormatListNumbered />
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <FormControl size="small" sx={{ minWidth: 80, ml: 1 }}>
                            <Select
                                startAdornment={<FontSizeIcon fontSize="small" sx={{ mr: 0.5 }} />}
                                value={fontSize}
                                onChange={handleFontSize}
                                displayEmpty
                                inputProps={{ 'aria-label': 'font size' }}
                            >
                                {FONT_SIZES.map((s) => (
                                    <MenuItem key={s.value} value={s.value}>
                                        {s.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 140, ml: 1 }}>
                            <Select
                                value={fontFamily}
                                onChange={handleFontFamily}
                                displayEmpty
                                inputProps={{ 'aria-label': 'font family' }}
                            >
                                {FONT_FAMILIES.map((f) => (
                                    <MenuItem key={f} value={f}>
                                        {f}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ flexGrow: 1 }} />

                        <Tooltip title="Save">
                            <IconButton size="small" onClick={handleSave} aria-label="save notes">
                                <SaveIcon />
                            </IconButton>
                        </Tooltip>
                    </Toolbar>

                    <Box
                        onClick={() => editorRef.current?.focus()}
                        sx={{
                            flexGrow: 1,
                            height: 'calc(100% - 48px)', // Adjust this if your toolbar height changes
                            overflow: 'hidden',
                            p: 2,
                            cursor: 'text',
                        }}
                    >
                        <Box
                            ref={editorRef}
                            component="div"
                            contentEditable
                            suppressContentEditableWarning
                            sx={{
                                height: '100%',
                                overflowY: 'auto',
                                p: 2,
                                outline: 'none',
                                fontFamily,
                                fontSize,
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                            }}
                        />
                    </Box>
                </Box>
                </Box>
            </>
            );
}
